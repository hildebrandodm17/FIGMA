# CLAUDE.md — CMS Headless Multi-tenant

## Visão Geral do Projeto

Sistema CMS Headless Multi-tenant de propósito geral. Um backend FastAPI único e um
painel administrativo React único servem N clientes (empresas) de qualquer nicho:
clínicas veterinárias, escritórios de advocacia, fábricas, restaurantes, e-commerces,
prestadores de serviço, consultórios médicos, etc.

Cada cliente acessa o painel com suas próprias credenciais e gerencia exclusivamente
o conteúdo do seu site. Os sites públicos de cada cliente são projetos React
independentes com layouts, marcas e identidades visuais completamente distintas,
todos consumindo a mesma API REST versionada.

O sistema é projetado para escalar horizontalmente (mais clientes) sem custo
operacional crescente até determinados limites bem definidos.

Documentação técnica detalhada em arquivos separados:
- [Banco de Dados](./docs/BANCO.md) — schema completo, índices, relacionamentos
- [API REST](./docs/API.md) — todos os endpoints, formatos, exemplos
- [Segurança](./docs/SEGURANCA.md) — autenticação, autorização, proteções
- [UI/UX](./docs/UIUX.md) — design system, componentes, responsividade

---

## Princípios do Projeto

1. **Isolamento total por empresa** — nenhum cliente acessa dados de outro, garantido
   em múltiplas camadas (JWT, queries, validação de endpoints)

2. **Modular e flexível** — cada cliente ativa apenas os módulos que precisa;
   quantidade de itens em cada módulo é sempre dinâmica, sem limites fixos

3. **API como contrato** — o backend não conhece nenhum frontend; retorna JSON limpo
   e padronizado; qualquer tecnologia de frontend pode consumir

4. **Segurança em camadas** — autenticação JWT + validação de empresa em cada request
   + rate limiting + sanitização de inputs + criptografia de credenciais sensíveis

5. **Performance previsível** — índices corretos, paginação obrigatória, cache para
   dados estáticos, connection pooling configurado para o ambiente

6. **Experiência do administrador** — o painel deve ser tão intuitivo que um cliente
   sem conhecimento técnico consiga operar sozinho após onboarding básico

---

## Stack Tecnológica

### Backend

| Pacote | Versão | Uso |
|--------|--------|-----|
| Python | 3.11+ | Linguagem principal |
| FastAPI | 0.111+ | Framework web, documentação automática |
| SQLAlchemy | 2.x async | ORM com suporte a async/await |
| asyncpg | latest | Driver PostgreSQL assíncrono |
| Supabase PostgreSQL | — | Banco de dados único multi-tenant |
| boto3 | latest | Cliente Cloudflare R2 (S3-compatível) |
| python-jose[cryptography] | latest | Geração e validação de JWT |
| passlib[bcrypt] | latest | Hash seguro de senhas |
| python-multipart | latest | Parsing de uploads multipart |
| Pillow | latest | Processamento de imagens (resize + WebP) |
| bleach | latest | Sanitização de HTML do TipTap (whitelist) |
| slowapi | latest | Rate limiting por IP por endpoint |
| cachetools | latest | Cache em memória com TTL (sem Redis) |
| cryptography (Fernet) | latest | Criptografia das credenciais R2 no banco |
| python-slugify | latest | Geração de slugs únicos por empresa |
| alembic | latest | Versionamento e migrações do banco |
| httpx | latest | HTTP assíncrono para webhooks de leads |
| resend | latest | Envio de e-mails (notificação de leads) |
| pydantic-settings | latest | Configuração via variáveis de ambiente |
| uvicorn | latest | Servidor ASGI para produção |

### Frontend Admin (painel único — serve todos os clientes)

| Pacote | Versão | Uso |
|--------|--------|-----|
| React | 18 | Framework UI |
| Vite | 5+ | Build tool e dev server |
| Tailwind CSS | 3.x | Estilização utilitária |
| TypeScript | 5+ | Tipagem estática |
| TipTap | 2.x | Editor rich text com toolbar customizada |
| Recharts | latest | Gráficos (Central de Leads — barras mensais) |
| React Router DOM | v6 | Roteamento SPA |
| Axios | latest | HTTP com interceptors (auth + empresa) |
| @dnd-kit/core + sortable | latest | Drag-and-drop para reordenação de itens |
| React Hook Form | latest | Gerenciamento de formulários performático |
| Zod | latest | Validação de schemas (compartilhado front/back) |
| Zustand | latest | Estado global (auth, empresa ativa no superadmin) |
| react-hot-toast | latest | Notificações toast |
| date-fns | latest | Formatação e manipulação de datas |
| lucide-react | latest | Ícones consistentes |
| @headlessui/react | latest | Componentes acessíveis (Modal, Dropdown, etc.) |

### Frontend Público (1 repositório independente por cliente)

| Pacote | Uso |
|--------|-----|
| React 18 + Vite + Tailwind CSS | Base (ou Next.js para SSR nativo) |
| Axios | HTTP com X-Empresa-Slug configurado globalmente |
| react-helmet-async | Injeção de meta tags SEO no `<head>` |
| Estrutura, layout e tema | Completamente livre por cliente |

> **Nota sobre Next.js:** para clientes que priorizam SEO (escritórios, clínicas),
> recomenda-se Next.js com SSR/SSG. Para sites institucionais simples, React + Vite
> com pre-rendering manual é suficiente.

---

## Estrutura de Pastas

### Backend (`cms-backend/`)

```
cms-backend/
├── alembic/
│   ├── versions/             # arquivos de migração gerados automaticamente
│   └── env.py                # configuração do alembic
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       │   ├── router.py       # POST /login, /refresh, /logout
│   │       │   └── schemas.py      # LoginRequest, TokenResponse
│   │       ├── public/             # endpoints para sites públicos
│   │       │   ├── router.py       # registra sub-routers de cada módulo
│   │       │   ├── config.py       # GET /site/config, /sitemap.xml, /robots.txt
│   │       │   ├── conteudo.py     # GET /site/posts, /site/posts/{slug}
│   │       │   ├── itens.py        # GET /site/itens, /site/itens/{slug}
│   │       │   ├── banners.py
│   │       │   ├── destaques.py
│   │       │   ├── equipe.py
│   │       │   ├── depoimentos.py
│   │       │   ├── faq.py
│   │       │   ├── galeria.py
│   │       │   └── leads.py        # POST /site/leads
│   │       ├── admin/              # endpoints autenticados do painel
│   │       │   ├── router.py
│   │       │   ├── banners.py
│   │       │   ├── posts.py
│   │       │   ├── categorias.py
│   │       │   ├── itens.py
│   │       │   ├── destaques.py
│   │       │   ├── equipe.py
│   │       │   ├── depoimentos.py
│   │       │   ├── faq.py
│   │       │   ├── galeria.py
│   │       │   ├── leads.py
│   │       │   ├── contatos.py
│   │       │   ├── arquivos.py
│   │       │   ├── configuracoes.py
│   │       │   ├── temas.py
│   │       │   ├── usuarios.py
│   │       │   └── modulos.py
│   │       └── superadmin/
│   │           ├── router.py
│   │           ├── empresas.py
│   │           └── dashboard.py    # visão geral de todas as empresas
│   ├── core/
│   │   ├── config.py               # Settings com pydantic-settings
│   │   ├── database.py             # engine, session factory, pool config
│   │   ├── security.py             # JWT create/verify, bcrypt, Fernet
│   │   ├── cache.py                # TTLCache wrapper para dados estáticos
│   │   ├── storage.py              # R2 client factory por empresa
│   │   └── dependencies.py        # get_db, get_current_user, require_role,
│   │                               # get_empresa_from_slug, check_permissao
│   ├── middleware/
│   │   ├── audit.py                # audit log automático em mutations
│   │   ├── cors.py                 # CORS dinâmico por domínio cadastrado
│   │   └── rate_limit.py           # configuração do slowapi
│   ├── models/                     # SQLAlchemy ORM (1 arquivo por domínio)
│   │   ├── base.py                 # BaseModel com id, timestamps, soft delete
│   │   ├── empresa.py
│   │   ├── usuario.py              # Usuario + UsuarioPermissao + RefreshToken
│   │   ├── configuracao.py         # Configuracao + Tema
│   │   ├── conteudo.py             # Post + Categoria
│   │   ├── item.py                 # Item + CategoriaItem
│   │   ├── apresentacao.py         # Banner + Destaque + Equipe + Depoimento
│   │   │                           # + Faq + Galeria
│   │   ├── lead.py
│   │   ├── contato.py
│   │   ├── arquivo.py
│   │   └── audit.py
│   ├── schemas/                    # Pydantic v2 (espelho dos models)
│   │   ├── base.py                 # PaginatedResponse, ErrorResponse
│   │   ├── auth.py
│   │   ├── empresa.py
│   │   ├── usuario.py
│   │   ├── configuracao.py
│   │   ├── conteudo.py
│   │   ├── item.py
│   │   ├── apresentacao.py
│   │   ├── lead.py
│   │   ├── contato.py
│   │   └── arquivo.py
│   ├── services/                   # Regras de negócio (routers só orquestram)
│   │   ├── auth_service.py         # login, refresh, logout, validação
│   │   ├── empresa_service.py      # criação com configurações padrão
│   │   ├── lead_service.py         # salvar, notificar, webhook
│   │   ├── storage_service.py      # upload, delete, listagem no R2
│   │   ├── seo_service.py          # gerar sitemap, robots, og tags
│   │   ├── configuracao_service.py # ler/escrever configurações por seção
│   │   └── notificacao_service.py  # e-mail via Resend
│   └── utils/
│       ├── image.py                # resize + convert WebP via Pillow
│       ├── sanitize.py             # bleach whitelist para TipTap HTML
│       ├── slug.py                 # gerar slug único por empresa
│       └── pagination.py          # helper de paginação para queries
├── tests/
│   ├── conftest.py                 # fixtures: db, client, empresa, usuários
│   ├── api/
│   │   ├── test_auth.py
│   │   ├── test_leads.py
│   │   └── test_posts.py
│   └── services/
│       └── test_storage.py
├── .env.example
├── main.py                         # app FastAPI, registro de routers, middlewares
└── requirements.txt
```

### Frontend Admin (`cms-admin/`)

```
cms-admin/
├── src/
│   ├── components/
│   │   ├── ui/                     # componentes genéricos reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Badge.tsx           # status: Ativo/Inativo
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmDialog.tsx   # confirmação de exclusão
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Skeleton.tsx        # loading states
│   │   │   ├── EmptyState.tsx      # quando lista está vazia
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # menu lateral responsivo
│   │   │   ├── Header.tsx          # breadcrumb + empresa ativa + avatar
│   │   │   ├── PageWrapper.tsx     # padding + título da página
│   │   │   └── MobileNav.tsx       # menu hamburguer para mobile
│   │   ├── forms/
│   │   │   ├── FormField.tsx       # wrapper com label + erro
│   │   │   ├── ImageUpload.tsx     # upload com preview + drag-and-drop
│   │   │   ├── MultiImageUpload.tsx # galeria de imagens do item
│   │   │   ├── SlugField.tsx       # campo slug com geração automática
│   │   │   ├── ColorPicker.tsx     # seletor de cor para temas
│   │   │   └── SelectCategoria.tsx # select com busca de categorias
│   │   ├── editor/
│   │   │   ├── RichEditor.tsx      # TipTap com toolbar completa
│   │   │   └── EditorToolbar.tsx   # botões de formatação
│   │   ├── table/
│   │   │   ├── DataTable.tsx       # tabela genérica com sort + filtro
│   │   │   ├── Pagination.tsx      # paginação
│   │   │   ├── SortableRow.tsx     # linha draggable (@dnd-kit)
│   │   │   └── TableActions.tsx    # Editar | Visualizar | Deletar
│   │   ├── charts/
│   │   │   ├── LeadsBarChart.tsx   # gráfico mensal de leads (Recharts)
│   │   │   └── StatsCard.tsx       # card de métrica (total, ativos, etc.)
│   │   └── seo/
│   │       └── SeoFields.tsx       # campos SEO reutilizáveis em posts
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── banners/
│   │   │   ├── BannerList.tsx
│   │   │   └── BannerForm.tsx
│   │   ├── posts/
│   │   │   ├── PostList.tsx        # filtra por tipo (post/noticia/etc.)
│   │   │   └── PostForm.tsx        # TipTap + campos SEO
│   │   ├── categorias/
│   │   │   ├── CategoriaList.tsx
│   │   │   └── CategoriaForm.tsx
│   │   ├── itens/
│   │   │   ├── ItemList.tsx
│   │   │   └── ItemForm.tsx        # TipTap + multi-imagem
│   │   ├── destaques/
│   │   │   ├── DestaqueList.tsx
│   │   │   └── DestaqueForm.tsx
│   │   ├── equipe/
│   │   │   ├── EquipeList.tsx
│   │   │   └── EquipeForm.tsx
│   │   ├── depoimentos/
│   │   │   ├── DepoimentoList.tsx
│   │   │   └── DepoimentoForm.tsx
│   │   ├── faq/
│   │   │   ├── FaqList.tsx
│   │   │   └── FaqForm.tsx
│   │   ├── galeria/
│   │   │   └── GaleriaPage.tsx     # upload múltiplo + grid visual
│   │   ├── leads/
│   │   │   ├── LeadList.tsx        # tabela + gráfico + exportar CSV
│   │   │   └── LeadDetail.tsx      # visualizar + marcar respondido
│   │   ├── contatos/
│   │   │   └── ContatosForm.tsx
│   │   ├── arquivos/
│   │   │   └── ArquivosPage.tsx    # gerenciador de mídias
│   │   ├── configuracoes/
│   │   │   └── ConfiguracoesPage.tsx # abas dinâmicas por seção
│   │   ├── temas/
│   │   │   └── TemasPage.tsx
│   │   ├── usuarios/
│   │   │   ├── UsuarioList.tsx
│   │   │   └── UsuarioForm.tsx     # + permissões por módulo
│   │   ├── modulos/
│   │   │   └── ModulosPage.tsx     # toggles por módulo
│   │   └── superadmin/
│   │       ├── EmpresaList.tsx
│   │       ├── EmpresaForm.tsx
│   │       └── EmpresaSwitch.tsx   # trocar empresa ativa
│   ├── hooks/
│   │   ├── useAuth.ts              # login, logout, usuário atual
│   │   ├── useEmpresa.ts           # empresa ativa (superadmin)
│   │   └── usePermissao.ts         # verificar permissão: (modulo, acao) => bool
│   ├── services/
│   │   ├── api.ts                  # axios instance com interceptors
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── itemService.ts
│   │   ├── leadService.ts
│   │   ├── arquivoService.ts
│   │   └── (demais serviços)
│   ├── store/
│   │   ├── authStore.ts            # Zustand: usuario, tokens, role
│   │   └── empresaStore.ts         # Zustand: empresa ativa (superadmin)
│   ├── types/
│   │   └── index.ts                # interfaces TypeScript espelhando schemas
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── formatFileSize.ts
│   │   └── generateSlug.ts
│   └── router.tsx                  # React Router com guards de autenticação
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## Papéis e Permissões

### Hierarquia de Acesso

```
SuperAdmin (você)
    │
    ├── Empresa A
    │       ├── Admin A         (acesso total à empresa A)
    │       ├── Usuario A1      (permissões definidas pelo Admin A)
    │       └── Usuario A2
    │
    ├── Empresa B
    │       ├── Admin B
    │       └── Usuario B1
    └── ...
```

### SuperAdmin
- Acesso total ao sistema sem restrição de empresa
- Pode visualizar, criar, editar e suspender qualquer empresa
- Pode trocar de empresa no painel via seletor de empresa
- Pode acessar dados e painel de qualquer cliente como se fosse o admin
- Acessa o dashboard geral com métricas de todas as empresas
- Gerencia quais módulos estão disponíveis por plano

### Admin (por empresa)
- Acesso total à sua empresa
- Não pode ver nem acessar outras empresas
- Cria e gerencia usuários da própria empresa
- Define as permissões de cada usuário, módulo por módulo
- Acessa todos os módulos ativos da empresa

### Usuário (por empresa)
- Permissões definidas pelo Admin da empresa
- Por módulo e por ação: `pode_ver`, `pode_criar`, `pode_editar`, `pode_deletar`, `pode_exportar`
- Exemplo: pode ver e criar posts, mas não deletar; pode ver leads, mas não exportar CSV
- O menu do painel exibe apenas os módulos onde o usuário tem `pode_ver = true`
- Botões de ação são ocultados quando o usuário não tem a permissão correspondente

---

## Módulos do Sistema

Cada módulo pode ser ativado ou desativado por empresa individualmente.
Quando desativado, os endpoints correspondentes retornam 404 e o item
some do menu lateral do painel.

| Módulo | Descrição | Uso típico |
|--------|-----------|------------|
| `banners` | Hero/carrossel com N banners dinâmicos e reordenáveis | Todos os nichos |
| `posts` | Blog, notícias, artigos, cases — tipo configurável por cliente | Todos |
| `categorias` | Categorias de posts e de itens | Todos com posts ou itens |
| `itens` | Produtos, serviços, procedimentos, áreas de atuação | Fábricas, clínicas, escritórios |
| `destaques` | Cards de diferenciais: Qualidade, Confiança, etc. | Todos |
| `equipe` | Membros da equipe com foto, cargo e bio | Clínicas, escritórios |
| `depoimentos` | Avaliações e depoimentos de clientes | Todos |
| `faq` | Perguntas frequentes | Clínicas, escritórios, e-commerce |
| `galeria` | Galeria de fotos de estrutura, eventos, portfólio | Todos |
| `leads` | CRM: captura, gestão, gráfico mensal, exportação CSV | Todos |
| `contatos` | Dados da empresa: endereço, mapa, redes sociais | Todos |
| `arquivos` | Gerenciador de mídias com upload para R2 | Todos |
| `configuracoes` | Textos editáveis de todas as páginas e seções | Todos |
| `temas` | Cores, fontes, logo — identidade visual | Todos |

---

## Fluxo de Dados

### Inserção pelo painel (admin)
```
1. Admin preenche formulário no painel React
2. React valida com Zod antes de enviar
3. POST /api/v1/admin/{modulo} com Bearer token no header
4. FastAPI verifica JWT → extrai { empresa_id, usuario_id, role, permissoes }
5. Verifica permissão: usuario tem pode_criar no módulo?
6. Passa para o service correspondente
7. Service executa regra de negócio (slugify, sanitize, resize imagem)
8. SQLAlchemy persiste no Supabase PostgreSQL com empresa_id
9. Cache invalidado se for dado estático (config, banners, tema)
10. Audit log registrado automaticamente
11. Response 201 com o objeto criado
12. React exibe toast de sucesso e atualiza a lista
```

### Leitura pelo site público (frontend)
```
1. React faz GET /api/v1/site/{modulo}
   com header X-Empresa-Slug: fercorr-embalagens
2. FastAPI lê o slug, busca empresa no cache (TTL 5min) ou banco
3. Verifica se a empresa está ativa e o módulo está habilitado
4. Executa query filtrada por empresa_id com índices corretos
5. Retorna JSON padronizado com { data, meta }
6. React renderiza no layout do cliente
```

### Upload de imagem
```
1. React envia multipart/form-data para POST /api/v1/admin/arquivos/upload
2. FastAPI valida magic bytes (não confia no Content-Type)
3. Valida extensão (.jpg .jpeg .png .webp .gif .pdf .svg)
4. Valida tamanho máximo (10MB)
5. Pillow redimensiona (max 2000px em qualquer dimensão)
6. Pillow converte para WebP (redução ~70% no tamanho)
7. boto3 envia para o bucket R2 específico da empresa
   com nome UUID gerado (não usa nome original por segurança)
8. Salva metadados na tabela arquivos (nome, url, tipo, tamanho, dimensões)
9. Retorna URL pública do arquivo
```

### Captura de lead (site público)
```
1. Visitante preenche formulário no site do cliente
2. React valida campos e envia POST /api/v1/site/leads
   com X-Empresa-Slug no header
3. FastAPI aplica rate limit: 3 leads/hora por IP
4. Valida LGPD: lgpd_aceito deve ser true
5. Registra lead no banco com ip_origem, origem (URL da página), timestamp
6. Dispara notificação por e-mail para a empresa (via Resend, assíncrono)
7. Dispara webhook se configurado pela empresa
8. Retorna 201 imediatamente (não espera o e-mail)
```

---

## Convenções de Código

### Backend — regras obrigatórias

**Isolamento multi-tenant:** empresa_id SEMPRE extraído do JWT ou do header
X-Empresa-Slug. NUNCA aceito como parâmetro na URL ou no body de endpoints admin.

```python
# CORRETO — empresa_id vem do token
@router.get("/posts")
async def listar_posts(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await post_service.listar(db, empresa_id=current_user.empresa_id)

# ERRADO — nunca assim
@router.get("/posts/{empresa_id}")  # empresa_id na URL é risco
```

**Services para lógica de negócio:** routers apenas recebem, validam e retornam.

```python
# CORRETO
@router.post("/posts")
async def criar_post(data: PostCreate, current_user=Depends(...), db=Depends(...)):
    return await post_service.criar(db, data, empresa_id=current_user.empresa_id)

# ERRADO — lógica no router
@router.post("/posts")
async def criar_post(data: PostCreate, ...):
    slug = slugify(data.titulo)  # isso vai no service
    post = Post(slug=slug, ...)  # isso vai no service
    db.add(post)
    ...
```

**Queries com selectinload:** nunca causar N+1.

```python
# CORRETO
result = await db.execute(
    select(Post)
    .options(selectinload(Post.categoria))
    .where(Post.empresa_id == empresa_id, Post.deletado_em.is_(None))
    .order_by(Post.publicado_em.desc())
)

# ERRADO — N+1
posts = (await db.execute(select(Post)...)).scalars()
for post in posts:
    categoria = await db.get(Categoria, post.categoria_id)  # 1 query por post!
```

**Paginação obrigatória em listagens:**

```python
# Todo endpoint de listagem aceita ?pagina=1&limite=20
# limite máximo: 100 (nunca retornar tudo sem paginar)
```

**Soft delete:** nunca DELETE no banco — sempre `deletado_em = now()`.

**Optimistic locking em updates:**

```python
# Verificar versão antes de atualizar
result = await db.execute(
    update(Post)
    .where(Post.id == id, Post.versao == data.versao, Post.empresa_id == empresa_id)
    .values(**data.dict(), versao=Post.versao + 1)
)
if result.rowcount == 0:
    raise HTTPException(409, "Conflito: registro foi alterado por outro usuário")
```

### Frontend Admin — regras obrigatórias

**Verificar permissão antes de renderizar ações:**

```tsx
// CORRETO — botão só aparece se tem permissão
const { pode } = usePermissao('posts', 'deletar')
{pode && <Button variant="danger" onClick={handleDelete}>Deletar</Button>}
```

**Lógica de API isolada em services:**

```tsx
// CORRETO
const posts = await postService.listar({ pagina, limite, tipo })

// ERRADO — axios direto no componente
const posts = await axios.get('/api/v1/admin/posts')
```

**Feedback visual obrigatório em toda ação:**
- Botões devem exibir spinner durante o request
- Sucesso: toast verde com mensagem clara
- Erro: toast vermelho com mensagem legível (não "Internal Server Error")
- Listas devem exibir skeleton durante o carregamento inicial
- Formulários devem desabilitar o submit durante o envio

**Confirmação obrigatória em ações destrutivas:**

```tsx
// Sempre usar ConfirmDialog antes de deletar ou desativar
<ConfirmDialog
  title="Deletar post"
  message="Esta ação não pode ser desfeita. Deseja continuar?"
  onConfirm={handleDelete}
/>
```

---

## Variáveis de Ambiente (`.env.example`)

```env
# ── Banco de Dados ──────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:senha@host:5432/cms_db

# ── JWT ─────────────────────────────────────────────────
JWT_SECRET_KEY=TROQUE-POR-SECRET-FORTE-256BITS
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7

# ── Criptografia das credenciais R2 no banco ────────────
# Gerar com: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=GERE-A-CHAVE-COM-O-COMANDO-ACIMA

# ── Cloudflare R2 (conta geral) ─────────────────────────
CF_ACCOUNT_ID=seu-account-id-cloudflare
# As credenciais específicas de cada cliente ficam no banco, criptografadas

# ── CORS ────────────────────────────────────────────────
ADMIN_FRONTEND_URL=https://painel.seu-cms.com.br
SUPERADMIN_URL=https://super.seu-cms.com.br

# ── E-mail (Resend) ─────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@seu-cms.com.br

# ── Ambiente ─────────────────────────────────────────────
ENVIRONMENT=development   # development | staging | production

# ── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_LOGIN=5/15minutes
RATE_LIMIT_LEADS=3/hour
RATE_LIMIT_UPLOAD=20/hour
RATE_LIMIT_PUBLIC=200/minute
```

---

## Comandos Frequentes

### Backend
```bash
# Instalar dependências
pip install -r requirements.txt

# Desenvolvimento com reload
uvicorn main:app --reload --port 8000

# Criar nova migração após alterar models
alembic revision --autogenerate -m "adiciona campo X em posts"

# Aplicar migrações pendentes
alembic upgrade head

# Reverter última migração
alembic downgrade -1

# Rodar testes
pytest tests/ -v --asyncio-mode=auto

# Documentação interativa (Swagger)
# http://localhost:8000/docs

# Documentação alternativa (ReDoc)
# http://localhost:8000/redoc
```

### Frontend Admin
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev        # http://localhost:5173

# Build de produção
npm run build

# Preview do build
npm run preview

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint
```

---

## Custos Operacionais

| Serviço | Custo Mensal | O que cobre |
|---------|-------------|-------------|
| Supabase Pro | $25 | PostgreSQL 8GB — banco de todos os clientes |
| Cloudflare R2 | $0 | 10GB free tier — ~50 clientes pequenos |
| Render Static Sites | $0 | Frontends públicos ilimitados com CDN |
| Render Web Service | $7 | Backend FastAPI sempre ativo |
| Resend (e-mails) | $0 | 3.000 e-mails/mês grátis |
| **Total** | **$32/mês** | Infraestrutura para N clientes |

A partir do **2º cliente** a infraestrutura está paga.
A partir do **3º cliente** é lucro puro de operação.

Quando o R2 ultrapassar 10GB (~50 clientes): $0.015/GB/mês adicional.
Quando o Supabase ultrapassar 8GB: considerar migrar para instância dedicada.
