# SEGURANCA.md — Segurança do Sistema

## Camadas de Segurança

O sistema implementa segurança em 7 camadas independentes. A falha de uma
camada não compromete o sistema inteiro.

```
1. HTTPS                → criptografia em trânsito (Cloudflare/Render)
2. CORS restritivo      → apenas domínios cadastrados
3. Rate limiting        → proteção contra brute force e spam
4. Autenticação JWT     → access token curto + refresh rotation
5. Autorização          → empresa_id do token + verificação de permissão
6. Validação de inputs  → Pydantic + sanitização de HTML + magic bytes
7. Criptografia em repouso → credenciais R2 com Fernet AES-128
```

---

## 1. HTTPS

Todo tráfego obrigatoriamente via HTTPS:
- Render e Cloudflare fornecem certificados TLS automaticamente
- Redirecionar HTTP → HTTPS no nível do proxy (não depender do FastAPI)
- HSTS header ativado: `Strict-Transport-Security: max-age=31536000`

---

## 2. CORS

O CORS é configurado dinamicamente. O painel admin e o superadmin
têm origens fixas. Os sites públicos dos clientes são adicionados
ao CORS via domínio cadastrado no banco.

```python
# app/middleware/cors.py

ORIGENS_FIXAS = [
    settings.ADMIN_FRONTEND_URL,   # https://painel.seu-cms.com.br
    settings.SUPERADMIN_URL,       # https://super.seu-cms.com.br
]

async def get_origens_permitidas(db) -> list[str]:
    # Busca domínios de todas as empresas ativas (cache TTL 5min)
    empresas = await empresa_service.listar_dominios_ativos(db)
    dominios_clientes = [f"https://{e.dominio}" for e in empresas if e.dominio]
    return ORIGENS_FIXAS + dominios_clientes
```

Nunca usar `origins=["*"]` — especialmente no admin.

---

## 3. Rate Limiting

Implementado com `slowapi`. Limites por endpoint e por IP:

| Endpoint | Limite | Janela | Motivo |
|----------|--------|--------|--------|
| `POST /auth/login` | 5 tentativas | 15 minutos | Brute force de senha |
| `POST /auth/refresh` | 20 tentativas | 1 hora | Refresh excessivo |
| `POST /site/leads` | 3 envios | 1 hora | Spam no formulário de contato |
| `POST /admin/arquivos/upload` | 20 uploads | 1 hora | Upload abusivo |
| `GET /site/*` (público) | 200 requests | 1 minuto | Scraping / DDoS básico |
| `GET /admin/*` | 300 requests | 1 minuto | Uso intenso do painel |

Ao atingir o limite, retorna HTTP 429 com header:
```
Retry-After: 900
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731600000
```

---

## 4. Autenticação JWT

### Estrutura dos tokens

**Access Token** (curta duração):
```json
{
  "sub": "uuid-usuario",
  "empresa_id": "uuid-empresa",
  "role": "admin",
  "permissoes": {
    "posts": ["ver", "criar", "editar"],
    "leads": ["ver", "exportar"]
  },
  "tipo": "access",
  "exp": 1731600900,
  "iat": 1731600000
}
```

**Refresh Token** (longa duração):
```json
{
  "sub": "uuid-usuario",
  "tipo": "refresh",
  "jti": "uuid-unico-do-token",
  "exp": 1732204800,
  "iat": 1731600000
}
```

### Refresh Token Rotation

O refresh token é armazenado como cookie httpOnly e rotacionado a cada uso.

```
Fluxo de rotação:
1. Client envia refresh token via cookie
2. Backend verifica hash na tabela refresh_tokens (não revogado, não expirado)
3. Backend marca o token atual como revogado (revogado = TRUE)
4. Backend gera novo refresh token
5. Salva o hash do novo token na tabela
6. Retorna novo access token + seta cookie com novo refresh token

Detecção de roubo de token:
- Se refresh token já revogado for usado → revogar TODOS os tokens do usuário
- Forçar novo login
- Logar o evento como incidente de segurança no audit_log
```

### Armazenamento seguro no frontend

```
Access token:  memória do React (Zustand store)
               NUNCA em localStorage (vulnerável a XSS)
               NUNCA em sessionStorage
Refresh token: cookie httpOnly (não acessível por JavaScript)
               SameSite=Strict, Secure, Max-Age=604800
```

### Renovação automática no frontend

```typescript
// api.ts — interceptor do axios
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      await authService.refresh()        // chama /auth/refresh
      return api(error.config)           // repete a request original
    }
    return Promise.reject(error)
  }
)
```

---

## 5. Autorização — Isolamento Multi-tenant

### Regra fundamental

O `empresa_id` **SEMPRE** vem do JWT, nunca da URL ou do body.

```python
# app/core/dependencies.py

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Usuario:
    payload = verify_access_token(token)
    usuario = await db.get(Usuario, payload["sub"])
    if not usuario or not usuario.ativo or usuario.deletado_em:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO"})
    return usuario


def require_role(*roles: str):
    async def dependency(current_user: Usuario = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(403, detail={"codigo": "NAO_AUTORIZADO"})
        return current_user
    return dependency


def check_permissao(modulo: str, acao: str):
    async def dependency(current_user: Usuario = Depends(get_current_user)):
        # SuperAdmin e Admin têm acesso total
        if current_user.role in ("superadmin", "admin"):
            return current_user
        # Usuario verifica permissão específica
        permissoes = current_user.permissoes  # carregado no JWT
        modulo_perms = permissoes.get(modulo, {})
        if not modulo_perms.get(acao, False):
            raise HTTPException(403, detail={"codigo": "NAO_AUTORIZADO"})
        return current_user
    return dependency
```

### Verificação de módulo ativo

```python
async def verificar_modulo_ativo(modulo: str, empresa_id: UUID, db):
    resultado = await db.execute(
        select(EmpresaModulo).where(
            EmpresaModulo.empresa_id == empresa_id,
            EmpresaModulo.modulo == modulo,
            EmpresaModulo.ativo == True
        )
    )
    if not resultado.scalar_one_or_none():
        raise HTTPException(404, detail={"codigo": "MODULO_INATIVO"})
```

### Uso nos routers

```python
@router.get("/posts")
async def listar_posts(
    current_user: Usuario = Depends(check_permissao("posts", "ver")),
    db: AsyncSession = Depends(get_db)
):
    await verificar_modulo_ativo("posts", current_user.empresa_id, db)
    return await post_service.listar(db, empresa_id=current_user.empresa_id)


@router.delete("/posts/{id}")
async def deletar_post(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("posts", "deletar")),
    db: AsyncSession = Depends(get_db)
):
    await post_service.deletar(db, id=id, empresa_id=current_user.empresa_id)
    # empresa_id do JWT garante que só o dono pode deletar
```

---

## 6. Validação de Inputs

### Pydantic — primeira linha de defesa

Todos os dados de entrada passam por schemas Pydantic com validações explícitas:

```python
class PostCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=500)
    slug: str = Field(..., min_length=3, max_length=500, pattern=r'^[a-z0-9-]+$')
    meta_desc: str | None = Field(None, max_length=160)
    meta_title: str | None = Field(None, max_length=70)
    indexavel: bool = True
    versao: int = Field(1, ge=1)
```

### Sanitização de HTML (TipTap)

O conteúdo rich text é HTML gerado pelo TipTap. Antes de salvar no banco,
passa pelo `bleach` com whitelist restritiva:

```python
# app/utils/sanitize.py

import bleach

TAGS_PERMITIDAS = [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'u', 's', 'mark',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

ATRIBUTOS_PERMITIDOS = {
    'a':   ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'td':  ['colspan', 'rowspan'],
    'th':  ['colspan', 'rowspan'],
    '*':   ['class'],
}

def sanitizar_html(html: str) -> str:
    return bleach.clean(
        html,
        tags=TAGS_PERMITIDAS,
        attributes=ATRIBUTOS_PERMITIDOS,
        strip=True       # remove tags não permitidas (não escapa)
    )
```

Bloqueia automaticamente: `<script>`, `<iframe>`, `onclick`, `onerror`,
`javascript:`, `data:text/html`, e qualquer atributo de evento.

### Validação de Uploads — Magic Bytes

Não confiar no `Content-Type` do header nem na extensão do arquivo.
Ler os primeiros bytes do arquivo para identificar o tipo real:

```python
# app/utils/image.py

MAGIC_BYTES = {
    b'\xff\xd8\xff':           'image/jpeg',
    b'\x89PNG\r\n\x1a\n':     'image/png',
    b'GIF87a':                 'image/gif',
    b'GIF89a':                 'image/gif',
    b'RIFF':                   'image/webp',  # verificar bytes 8-11 = WEBP
    b'%PDF':                   'application/pdf',
    b'<svg':                   'image/svg+xml',
}

EXTENSOES_PERMITIDAS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.svg'}
TAMANHO_MAXIMO = 10 * 1024 * 1024  # 10MB

async def validar_arquivo(arquivo: UploadFile) -> str:
    # 1. Verificar tamanho
    conteudo = await arquivo.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(422, "Arquivo excede 10MB")
    await arquivo.seek(0)

    # 2. Verificar extensão
    ext = Path(arquivo.filename).suffix.lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise HTTPException(422, f"Extensão {ext} não permitida")

    # 3. Verificar magic bytes (tipo real)
    primeiros_bytes = conteudo[:8]
    tipo_real = None
    for magic, mime in MAGIC_BYTES.items():
        if primeiros_bytes.startswith(magic):
            tipo_real = mime
            break

    if not tipo_real:
        raise HTTPException(422, "Tipo de arquivo não identificado ou não permitido")

    return tipo_real
```

### Processamento de Imagens

Antes de enviar para o R2, processar a imagem com Pillow:

```python
async def processar_imagem(conteudo: bytes, tipo: str) -> bytes:
    imagem = Image.open(BytesIO(conteudo))

    # Converter RGBA para RGB (WebP não precisa, mas JPEG sim)
    if imagem.mode in ('RGBA', 'P'):
        imagem = imagem.convert('RGB')

    # Redimensionar se maior que 2000px em qualquer dimensão
    MAX_DIM = 2000
    if imagem.width > MAX_DIM or imagem.height > MAX_DIM:
        imagem.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    # Converter para WebP (~70% menor que JPEG equivalente)
    output = BytesIO()
    imagem.save(output, format='WebP', quality=85, optimize=True)
    return output.getvalue()
```

### Nome do Arquivo no R2

Nunca usar o nome original do arquivo:

```python
import uuid

def gerar_nome_arquivo(extensao_original: str) -> str:
    # Sempre WebP para imagens processadas
    return f"{uuid.uuid4()}.webp"
    # Para PDFs e SVGs: f"{uuid.uuid4()}{extensao_original}"
```

---

## 7. Criptografia das Credenciais R2

As chaves de acesso ao R2 de cada cliente são dados extremamente sensíveis.
Ficam armazenadas no banco criptografadas com Fernet (AES-128-CBC + HMAC-SHA256).

```python
# app/core/security.py

from cryptography.fernet import Fernet

def get_fernet() -> Fernet:
    return Fernet(settings.FERNET_KEY.encode())

def criptografar(valor: str) -> str:
    return get_fernet().encrypt(valor.encode()).decode()

def descriptografar(valor_criptografado: str) -> str:
    return get_fernet().decrypt(valor_criptografado.encode()).decode()
```

A chave Fernet (`FERNET_KEY`) fica apenas no `.env` — nunca no banco ou no código.

Para gerar uma nova chave:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 8. Security Headers

Adicionar no middleware do FastAPI ou no Nginx/proxy:

```python
# main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response
```

---

## 9. Audit Log

Toda ação de escrita (criar, editar, deletar) é registrada automaticamente
via middleware. O log é imutável — não tem soft delete, não pode ser editado.

```python
# app/middleware/audit.py

ACOES_AUDITADAS = {'POST', 'PUT', 'PATCH', 'DELETE'}

async def registrar_audit(
    db, usuario_id, empresa_id, acao, tabela, registro_id,
    dados_antes=None, dados_depois=None, ip=None
):
    log = AuditLog(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        acao=acao,
        tabela=tabela,
        registro_id=registro_id,
        dados_antes=dados_antes,
        dados_depois=dados_depois,
        ip=ip
    )
    db.add(log)
    await db.commit()
```

---

## 10. LGPD — Leads

Todo lead capturado deve registrar o consentimento explícito do visitante:

```python
class LeadCreate(BaseModel):
    nome: str
    email: EmailStr
    telefone: str | None
    mensagem: str | None
    origem: str | None
    lgpd_aceito: bool

    @validator('lgpd_aceito')
    def lgpd_deve_ser_aceito(cls, v):
        if not v:
            raise ValueError('É necessário aceitar a política de privacidade')
        return v
```

O `lgpd_ip` e `lgpd_aceito_em` são preenchidos automaticamente pelo backend.

---

## 11. Webhook de Leads (HMAC)

Ao notificar a empresa via webhook, assinar o payload com HMAC-SHA256:

```python
import hmac, hashlib, json

def assinar_payload(payload: dict, secret: str) -> str:
    corpo = json.dumps(payload, separable=(',', ':')).encode()
    return hmac.new(secret.encode(), corpo, hashlib.sha256).hexdigest()

# Header enviado na requisição webhook:
# X-CMS-Signature: sha256=<hex_digest>
```

O cliente valida a assinatura antes de processar o webhook,
evitando que terceiros forjem eventos de leads.

---

## 12. SQL Injection

O SQLAlchemy ORM previne SQL injection por padrão via parâmetros vinculados.
Nunca usar f-strings ou concatenação de strings em queries:

```python
# CORRETO — SQLAlchemy ORM (seguro)
result = await db.execute(
    select(Post).where(Post.empresa_id == empresa_id, Post.slug == slug)
)

# CORRETO — query raw com parâmetros vinculados (seguro)
result = await db.execute(
    text("SELECT * FROM posts WHERE empresa_id = :eid AND slug = :slug"),
    {"eid": str(empresa_id), "slug": slug}
)

# ERRADO — SQL injection possível
result = await db.execute(
    text(f"SELECT * FROM posts WHERE slug = '{slug}'")
)
```

---

## Checklist de Segurança por Release

Antes de cada deploy em produção:

- [ ] Variáveis de ambiente configuradas (JWT_SECRET_KEY, FERNET_KEY fortes)
- [ ] CORS configurado apenas para domínios reais
- [ ] Rate limits ativos e testados
- [ ] HTTPS ativo com redirect de HTTP
- [ ] Magic bytes validando uploads
- [ ] Soft delete funcionando (nenhum DELETE físico em tabelas principais)
- [ ] Audit log registrando todas as mutations
- [ ] Tokens JWT com expiração curta (15min access, 7d refresh)
- [ ] Refresh token rotation ativa
- [ ] Credenciais R2 criptografadas no banco
- [ ] Logs sem dados sensíveis (senhas, tokens, chaves)
- [ ] `.env` fora do repositório
- [ ] Backup do banco configurado no Supabase
