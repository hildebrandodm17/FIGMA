# API.md — Endpoints REST

## Visão Geral

API REST versionada em `/api/v1/`. Toda resposta segue o formato padrão abaixo.
Documentação interativa disponível em `/docs` (Swagger UI) e `/redoc` (ReDoc).

---

## Formato Padrão de Resposta

### Sucesso — lista paginada
```json
{
  "data": [...],
  "meta": {
    "total": 145,
    "pagina": 1,
    "limite": 20,
    "paginas": 8
  }
}
```

### Sucesso — objeto único
```json
{
  "data": { ... }
}
```

### Erro
```json
{
  "erro": {
    "codigo": "NAO_AUTORIZADO",
    "mensagem": "Token inválido ou expirado"
  }
}
```

### Códigos de erro padronizados

| Código | HTTP | Descrição |
|--------|------|-----------|
| `NAO_AUTENTICADO` | 401 | Token ausente ou inválido |
| `NAO_AUTORIZADO` | 403 | Sem permissão para esta ação |
| `NAO_ENCONTRADO` | 404 | Recurso não existe ou foi deletado |
| `MODULO_INATIVO` | 404 | Módulo não está ativo para esta empresa |
| `CONFLITO_VERSAO` | 409 | Edição simultânea — versão desatualizada |
| `CONFLITO_SLUG` | 409 | Slug já existe para esta empresa |
| `RATE_LIMIT` | 429 | Muitas requisições |
| `VALIDACAO` | 422 | Dados inválidos (detalhes no campo `detalhes`) |
| `ERRO_INTERNO` | 500 | Erro não esperado |

---

## Parâmetros de Paginação

Todos os endpoints de listagem aceitam:

| Parâmetro | Tipo | Padrão | Máximo | Descrição |
|-----------|------|--------|--------|-----------|
| `pagina` | int | 1 | — | Número da página |
| `limite` | int | 20 | 100 | Itens por página |
| `ordem` | string | varia | — | Campo para ordenar |
| `direcao` | string | `desc` | — | `asc` ou `desc` |
| `busca` | string | — | — | Busca por texto (nome, título, email) |
| `ativo` | bool | — | — | Filtrar por status ativo/inativo |

---

## Autenticação

### `POST /api/v1/auth/login`

Autentica o usuário e retorna os tokens. O refresh token é enviado como
cookie httpOnly, não no body.

**Request:**
```json
{
  "email": "admin@fercorr.com.br",
  "senha": "minhasenha123"
}
```

**Response 200:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expira_em": 900,
    "usuario": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "admin@fercorr.com.br",
      "role": "admin",
      "empresa_id": "uuid",
      "empresa_nome": "Fercorr Embalagens",
      "permissoes": {}
    }
  }
}
```

**Set-Cookie (httpOnly):** `refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

Rate limit: 5 tentativas por IP a cada 15 minutos.

---

### `POST /api/v1/auth/refresh`

Renova o access token usando o refresh token do cookie.
Implementa rotação: o refresh token anterior é invalidado e um novo é gerado.

**Não exige body.** Lê o cookie `refresh_token` automaticamente.

**Response 200:** mesmo formato do login.

---

### `POST /api/v1/auth/logout`

Invalida o refresh token atual. Deve ser chamado ao fazer logout.

**Response 204:** sem body.

---

## Sites Públicos (`/api/v1/site/`)

Todos os endpoints públicos exigem o header:
```
X-Empresa-Slug: fercorr-embalagens
```

Não exigem autenticação JWT. Rate limit: 200 req/minuto por IP.

---

### `GET /api/v1/site/config`

Retorna todas as configurações necessárias para montar o site.
Resposta em cache por 5 minutos.

**Response 200:**
```json
{
  "data": {
    "empresa": {
      "nome": "Fercorr Embalagens",
      "slug": "fercorr-embalagens"
    },
    "modulos_ativos": ["banners", "posts", "produtos", "leads", "contatos"],
    "configuracoes": {
      "frontend": {
        "titulo": "Fercorr Embalagens",
        "logo": "https://assets.fercorr.com.br/logo.webp"
      },
      "menu": {
        "item_01": "HOME",
        "item_02": "SOBRE NÓS",
        "item_03": "PRODUTOS",
        "item_04": "BLOG",
        "item_05": "CONTATO"
      },
      "redes-sociais": {
        "whatsapp": "19999304399",
        "instagram": "https://instagram.com/fercorrembalagens/"
      }
    },
    "tema": {
      "cor_primaria": "#1B5E20",
      "cor_secundaria": "#2E7D32",
      "fonte_principal": "Inter"
    },
    "contato": {
      "whatsapp": "19999304399",
      "email": "contato@fercorr.com.br"
    }
  }
}
```

---

### `GET /api/v1/site/banners`

Lista todos os banners ativos, ordenados por `ordem`.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "titulo": "Embalagens sustentáveis",
      "subtitulo": "de alta qualidade",
      "texto": "preservando o meio ambiente...",
      "label_cta": "FALE CONOSCO",
      "link_cta": "/contato",
      "imagem_url": "https://assets.fercorr.com.br/banner-01.webp",
      "imagem_mobile": "https://assets.fercorr.com.br/banner-01-mobile.webp",
      "ordem": 1
    }
  ]
}
```

---

### `GET /api/v1/site/posts`

Lista posts publicados. Suporta filtro por tipo.

**Query params:**
- `tipo` — `post` | `noticia` | `artigo` | etc.
- `categoria_slug` — filtrar por categoria
- `pagina`, `limite`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tipo": "post",
      "titulo": "Como escolher a embalagem certa",
      "slug": "como-escolher-embalagem-certa",
      "resumo": "Descubra os critérios principais...",
      "imagem_capa": "https://assets.fercorr.com.br/post-01.webp",
      "autor": "João Silva",
      "publicado_em": "2025-09-15T10:00:00Z",
      "categoria": { "id": "uuid", "nome": "Dicas", "slug": "dicas" }
    }
  ],
  "meta": { "total": 12, "pagina": 1, "limite": 10, "paginas": 2 }
}
```

---

### `GET /api/v1/site/posts/{slug}`

Retorna um post completo com conteúdo e metadados SEO.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "titulo": "Como escolher a embalagem certa",
    "slug": "como-escolher-embalagem-certa",
    "conteudo": { ... },
    "imagem_capa": "https://...",
    "publicado_em": "2025-09-15T10:00:00Z",
    "seo": {
      "meta_title": "Como escolher a embalagem certa | Fercorr",
      "meta_desc": "Descubra os critérios principais para escolher...",
      "og_image": "https://assets.fercorr.com.br/post-01.webp",
      "og_title": "Como escolher a embalagem certa",
      "canonical_url": "https://fercorr.com.br/blog/como-escolher-embalagem-certa",
      "indexavel": true
    }
  }
}
```

---

### `GET /api/v1/site/itens`

Lista itens ativos (produtos, serviços, procedimentos, etc.).

**Query params:** `categoria_slug`, `pagina`, `limite`

---

### `GET /api/v1/site/itens/{slug}`

Retorna um item completo com descrição rich text e galeria de imagens.

---

### `GET /api/v1/site/destaques`

Lista destaques ativos ordenados por `ordem`.

---

### `GET /api/v1/site/equipe`

Lista membros da equipe ativos ordenados por `ordem`.

---

### `GET /api/v1/site/depoimentos`

Lista depoimentos ativos ordenados por `ordem`.

---

### `GET /api/v1/site/faq`

Lista perguntas frequentes ativas ordenadas por `ordem`.

---

### `GET /api/v1/site/galeria`

Lista itens da galeria ativos ordenados por `ordem`.

---

### `POST /api/v1/site/leads`

Captura um lead enviado pelo formulário de contato do site público.

Rate limit: 3 leads por hora por IP.

**Request:**
```json
{
  "nome": "Carlos Oliveira",
  "email": "carlos@empresa.com",
  "telefone": "19988887777",
  "mensagem": "Gostaria de um orçamento para 500 caixas",
  "origem": "https://fercorr.com.br/contato",
  "lgpd_aceito": true
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "mensagem": "Mensagem enviada com sucesso. Entraremos em contato em breve."
  }
}
```

---

### `GET /api/v1/site/sitemap.xml`

Retorna o sitemap XML com todos os posts publicados e páginas estáticas.
Usado pelo Google para indexação. Atualizado dinamicamente.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fercorr.com.br/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fercorr.com.br/blog/como-escolher-embalagem</loc>
    <lastmod>2025-09-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

### `GET /api/v1/site/robots.txt`

Retorna o robots.txt da empresa. Aponta para o sitemap.

```
User-agent: *
Allow: /
Sitemap: https://fercorr.com.br/api/v1/site/sitemap.xml
```

---

## Painel Admin (`/api/v1/admin/`)

Todos os endpoints admin exigem o header:
```
Authorization: Bearer <access_token>
```

O `empresa_id` é sempre extraído do JWT — nunca informado na URL ou no body.

---

### Auth — Dashboard

#### `GET /api/v1/admin/dashboard`

Retorna métricas resumidas da empresa para a tela inicial do painel.

**Response 200:**
```json
{
  "data": {
    "leads": {
      "total": 1345,
      "ativos": 0,
      "respondidos": 1345,
      "ultimos_30_dias": 52,
      "por_mes": [
        { "mes": "2025-01", "total": 68 },
        { "mes": "2025-02", "total": 133 }
      ]
    },
    "posts": { "total": 24, "publicados": 18, "rascunhos": 6 },
    "itens": { "total": 15, "ativos": 12 },
    "arquivos": { "total": 87, "tamanho_total_bytes": 45123456 }
  }
}
```

---

### Banners

#### `GET /api/v1/admin/banners`
Lista todos os banners (ativos e inativos), paginados.

#### `POST /api/v1/admin/banners`
Cria novo banner. Requer `pode_criar` no módulo `banners`.

**Request:**
```json
{
  "titulo": "Embalagens sustentáveis",
  "subtitulo": "de alta qualidade",
  "texto": "preservando o meio ambiente...",
  "label_cta": "FALE CONOSCO",
  "link_cta": "/contato",
  "imagem_url": "https://assets.fercorr.com.br/banner.webp",
  "imagem_mobile": null,
  "ordem": 1,
  "ativo": true
}
```

#### `GET /api/v1/admin/banners/{id}`
Retorna um banner específico.

#### `PUT /api/v1/admin/banners/{id}`
Atualiza banner. Requer `pode_editar`.

#### `DELETE /api/v1/admin/banners/{id}`
Soft delete. Requer `pode_deletar`.

#### `PATCH /api/v1/admin/banners/reordenar`
Atualiza a ordem de múltiplos banners (usado após drag-and-drop).

**Request:**
```json
{
  "ordem": [
    { "id": "uuid-banner-1", "ordem": 1 },
    { "id": "uuid-banner-2", "ordem": 2 },
    { "id": "uuid-banner-3", "ordem": 3 }
  ]
}
```

---

### Posts (Blog / Notícias / Artigos)

#### `GET /api/v1/admin/posts`
Query params: `tipo`, `publicado`, `categoria_id`, `pagina`, `limite`, `busca`

#### `POST /api/v1/admin/posts`

**Request:**
```json
{
  "tipo": "post",
  "titulo": "Como escolher a embalagem certa",
  "slug": "como-escolher-embalagem-certa",
  "resumo": "Descubra os critérios principais...",
  "conteudo": { "type": "doc", "content": [...] },
  "imagem_capa": "https://...",
  "categoria_id": "uuid",
  "autor": "João Silva",
  "publicado": true,
  "publicado_em": "2025-09-15T10:00:00Z",
  "meta_title": "Como escolher a embalagem certa | Fercorr",
  "meta_desc": "Descubra os critérios para escolher...",
  "og_image": "https://...",
  "og_title": null,
  "canonical_url": null,
  "indexavel": true,
  "versao": 1
}
```

#### `GET /api/v1/admin/posts/{id}`
#### `PUT /api/v1/admin/posts/{id}` — inclui `versao` para optimistic locking
#### `DELETE /api/v1/admin/posts/{id}`

---

### Itens (Produtos / Serviços / Procedimentos)

#### `GET /api/v1/admin/itens`
#### `POST /api/v1/admin/itens`
#### `GET /api/v1/admin/itens/{id}`
#### `PUT /api/v1/admin/itens/{id}`
#### `DELETE /api/v1/admin/itens/{id}`
#### `PATCH /api/v1/admin/itens/reordenar`

---

### Categorias

#### `GET /api/v1/admin/categorias?tipo=post|item`
#### `POST /api/v1/admin/categorias`
#### `PUT /api/v1/admin/categorias/{id}`
#### `DELETE /api/v1/admin/categorias/{id}`

---

### Destaques / Equipe / Depoimentos / FAQ / Galeria

Todos seguem o mesmo padrão CRUD + reordenar:

```
GET    /api/v1/admin/{modulo}
POST   /api/v1/admin/{modulo}
GET    /api/v1/admin/{modulo}/{id}
PUT    /api/v1/admin/{modulo}/{id}
DELETE /api/v1/admin/{modulo}/{id}
PATCH  /api/v1/admin/{modulo}/reordenar
```

---

### Leads

#### `GET /api/v1/admin/leads`

Query params: `respondido`, `data_inicio`, `data_fim`, `pagina`, `limite`, `busca`

**Response** inclui os dados completos do lead: nome, email, telefone, mensagem,
origem, IP, data, status de resposta.

#### `GET /api/v1/admin/leads/{id}`

Retorna um lead completo.

#### `PUT /api/v1/admin/leads/{id}`

Atualiza status do lead (marcar como respondido).

**Request:**
```json
{
  "respondido": true
}
```

#### `DELETE /api/v1/admin/leads/{id}`

Soft delete. Requer `pode_deletar`.

#### `GET /api/v1/admin/leads/export`

Exporta todos os leads filtrados em formato CSV. Requer `pode_exportar`.

**Response:** `Content-Type: text/csv` com arquivo para download.

#### `GET /api/v1/admin/leads/grafico`

Retorna totais por mês para o gráfico de barras da Central de Leads.

**Response:**
```json
{
  "data": [
    { "mes": "janeiro", "total": 68 },
    { "mes": "fevereiro", "total": 133 },
    ...
  ]
}
```

---

### Arquivos

#### `POST /api/v1/admin/arquivos/upload`

Upload de arquivo para o R2 da empresa.

**Request:** `multipart/form-data` com campo `arquivo`.

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "url": "https://assets.fercorr.com.br/a3f8c2d1.webp",
    "tipo": "image",
    "tamanho_bytes": 45678,
    "largura": 1200,
    "altura": 800
  }
}
```

#### `GET /api/v1/admin/arquivos`

Lista arquivos com filtro por tipo. Paginado.

#### `DELETE /api/v1/admin/arquivos/{id}`

Remove do banco e do R2.

---

### Configurações

#### `GET /api/v1/admin/configuracoes`

Retorna todas as seções e suas chaves/valores.

#### `GET /api/v1/admin/configuracoes/{secao}`

Retorna as chaves/valores de uma seção específica.

#### `PUT /api/v1/admin/configuracoes/{secao}`

Atualiza uma ou mais chaves de uma seção. Cria as chaves se não existirem.

**Request:**
```json
{
  "valores": {
    "titulo": "Fercorr Embalagens",
    "logo": "https://assets.fercorr.com.br/logo.webp"
  }
}
```

#### `POST /api/v1/admin/configuracoes/{secao}/nova-chave`

Adiciona uma nova chave customizada a uma seção existente.

**Request:**
```json
{
  "chave": "texto_destaque",
  "valor": "Mais de 25 anos de experiência",
  "tipo": "texto"
}
```

---

### Temas

#### `GET /api/v1/admin/temas`
#### `PUT /api/v1/admin/temas`

**Request:**
```json
{
  "cor_primaria": "#1B5E20",
  "cor_secundaria": "#2E7D32",
  "cor_destaque": "#FDD835",
  "fonte_principal": "Inter"
}
```

---

### Usuários

#### `GET /api/v1/admin/usuarios`
Lista usuários da empresa (admin e usuarios). Apenas admins acessam.

#### `POST /api/v1/admin/usuarios`

Cria novo usuário vinculado à empresa. Apenas admins.

**Request:**
```json
{
  "nome": "Maria Costa",
  "email": "maria@fercorr.com.br",
  "senha": "senha123",
  "role": "usuario",
  "permissoes": {
    "posts": { "pode_ver": true, "pode_criar": true, "pode_editar": true, "pode_deletar": false, "pode_exportar": false },
    "leads": { "pode_ver": true, "pode_criar": false, "pode_editar": false, "pode_deletar": false, "pode_exportar": false }
  }
}
```

#### `PUT /api/v1/admin/usuarios/{id}`
Atualiza dados e permissões. Apenas admins.

#### `DELETE /api/v1/admin/usuarios/{id}`
Soft delete. Apenas admins.

---

### Módulos

#### `GET /api/v1/admin/modulos`

Retorna todos os módulos disponíveis com status ativo/inativo.

**Response:**
```json
{
  "data": [
    { "modulo": "banners", "ativo": true },
    { "modulo": "posts", "ativo": true },
    { "modulo": "equipe", "ativo": false }
  ]
}
```

#### `PATCH /api/v1/admin/modulos/{modulo}`

Ativa ou desativa um módulo. Apenas admins.

**Request:**
```json
{ "ativo": false }
```

---

### Contatos

#### `GET /api/v1/admin/contatos`
#### `PUT /api/v1/admin/contatos`

---

## SuperAdmin (`/api/v1/superadmin/`)

Exige token JWT com `role: superadmin`.

### `GET /api/v1/superadmin/dashboard`

Visão geral de todas as empresas: total de clientes, leads do mês, etc.

### `GET /api/v1/superadmin/empresas`

Lista todas as empresas (ativas e inativas), paginada, com busca.

### `POST /api/v1/superadmin/empresas`

Cria nova empresa e provisiona automaticamente:
configurações padrão, tema, módulos, contato e usuário admin.

**Request:**
```json
{
  "nome": "Fercorr Embalagens",
  "slug": "fercorr-embalagens",
  "dominio": "fercorr.com.br",
  "plano": "profissional",
  "admin_nome": "João Silva",
  "admin_email": "joao@fercorr.com.br",
  "admin_senha": "senha_temporaria_123"
}
```

### `GET /api/v1/superadmin/empresas/{id}`
### `PUT /api/v1/superadmin/empresas/{id}`
### `DELETE /api/v1/superadmin/empresas/{id}`

### `POST /api/v1/superadmin/empresas/{id}/suspender`
Desativa a empresa. Todos os sites públicos passam a retornar 404.

### `POST /api/v1/superadmin/empresas/{id}/ativar`
Reativa uma empresa suspensa.

### `POST /api/v1/superadmin/impersonar/{empresa_id}`

Retorna um access token com as permissões do admin da empresa.
Permite ao superadmin acessar o painel de qualquer cliente sem saber a senha.

**Response:** access token com `role: admin` e `empresa_id` da empresa selecionada,
mais flag `impersonado: true` para o painel exibir o aviso visual.
