# BANCO.md — Schema do Banco de Dados

## Visão Geral

Banco PostgreSQL único hospedado no Supabase Pro. Todos os clientes (empresas)
compartilham o mesmo banco. O isolamento é garantido pela coluna `empresa_id`
presente em todas as tabelas filhas, sempre filtrada no backend via JWT.

O frontend nunca acessa o banco diretamente. Todo acesso passa pelo FastAPI,
que extrai o `empresa_id` do token e filtra todas as queries automaticamente.

---

## Convenções Globais

| Convenção | Descrição |
|-----------|-----------|
| `id UUID` | Primary key gerada com `gen_random_uuid()` |
| `empresa_id UUID` | Foreign key obrigatória em todas as tabelas filhas |
| `created_at TIMESTAMP` | Preenchido automaticamente via `DEFAULT NOW()` |
| `updated_at TIMESTAMP` | Atualizado via trigger em toda UPDATE |
| `deletado_em TIMESTAMP NULL` | NULL = ativo; preenchido = soft deleted |
| `versao INTEGER` | Optimistic locking em entidades editáveis |
| `ordem INTEGER` | Controla a ordenação dos itens (drag-and-drop) |
| `ativo BOOLEAN` | Controla visibilidade pública sem deletar o registro |

---

## Trigger de `updated_at`

Criar função e trigger que mantém `updated_at` atualizado automaticamente:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em cada tabela que tem updated_at:
CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- (repetir para cada tabela)
```

---

## Tabelas de Sistema e Acesso

### `empresas`

Tabela raiz. Cada registro representa um cliente (site).

```sql
CREATE TABLE empresas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(200) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,   -- usado no X-Empresa-Slug
  dominio         VARCHAR(200),                    -- domínio do site público (ex: fercorr.com.br)
  plano           VARCHAR(50) NOT NULL DEFAULT 'basico',  -- basico | profissional | enterprise
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  -- Credenciais R2 (criptografadas com Fernet)
  r2_bucket_name  VARCHAR(200),
  r2_access_key   TEXT,                            -- AES-128 Fernet encrypted
  r2_secret_key   TEXT,                            -- AES-128 Fernet encrypted
  r2_public_url   VARCHAR(500),                    -- URL base pública: https://assets.dominio.com.br
  -- Webhooks
  webhook_leads   VARCHAR(1000),                   -- URL chamada ao receber novo lead
  webhook_secret  TEXT,                            -- secret para HMAC do webhook
  -- Controle
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em     TIMESTAMP NULL
);
```

### `usuarios`

Usuários do painel administrativo. `empresa_id NULL` = SuperAdmin.

```sql
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES empresas(id) ON DELETE CASCADE,  -- NULL para superadmin
  nome            VARCHAR(200) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,
  senha_hash      TEXT NOT NULL,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'usuario')),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso   TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em     TIMESTAMP NULL
);
```

### `usuario_permissoes`

Permissões granulares por módulo para usuários com role `usuario`.
Admins não precisam de registro aqui — têm acesso total implícito.

```sql
CREATE TABLE usuario_permissoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo        VARCHAR(50) NOT NULL,
  pode_ver      BOOLEAN NOT NULL DEFAULT FALSE,
  pode_criar    BOOLEAN NOT NULL DEFAULT FALSE,
  pode_editar   BOOLEAN NOT NULL DEFAULT FALSE,
  pode_deletar  BOOLEAN NOT NULL DEFAULT FALSE,
  pode_exportar BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, modulo)
);

-- Módulos válidos para o campo `modulo`:
-- banners, posts, categorias, itens, destaques, equipe,
-- depoimentos, faq, galeria, leads, contatos, arquivos,
-- configuracoes, temas, usuarios, modulos
```

### `refresh_tokens`

Controle de refresh tokens com rotação. Nunca armazenar o token bruto — apenas seu hash.

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,        -- SHA-256 do token, não o token em si
  ip          VARCHAR(45),                 -- IPv4 ou IPv6
  user_agent  TEXT,
  expira_em   TIMESTAMP NOT NULL,
  revogado    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### `empresa_modulos`

Quais módulos estão ativos por empresa. Criado com defaults ao cadastrar a empresa.

```sql
CREATE TABLE empresa_modulos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo      VARCHAR(50) NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (empresa_id, modulo)
);
```

Módulos criados automaticamente ao cadastrar empresa (todos ativos por padrão):
`banners`, `posts`, `categorias`, `itens`, `destaques`, `equipe`,
`depoimentos`, `faq`, `galeria`, `leads`, `contatos`, `arquivos`,
`configuracoes`, `temas`

### `audit_log`

Rastreamento de todas as ações importantes no painel. Registro imutável.

```sql
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID REFERENCES empresas(id),
  usuario_id   UUID REFERENCES usuarios(id),
  acao         VARCHAR(50) NOT NULL,    -- criar | editar | deletar | login | logout | upload | exportar
  tabela       VARCHAR(100),            -- nome da tabela afetada
  registro_id  UUID,                    -- id do registro afetado
  dados_antes  JSONB,                   -- estado antes da alteração (para edições)
  dados_depois JSONB,                   -- estado após a alteração
  ip           VARCHAR(45),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
  -- Sem updated_at e deletado_em — audit log é imutável
);
```

---

## Configurações

### `configuracoes`

Sistema chave-valor extensível. Cada seção é uma aba na tela de Configurações do painel.
Permite adicionar novas configurações sem alterar o schema do banco.

```sql
CREATE TABLE configuracoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  secao       VARCHAR(100) NOT NULL,     -- frontend | menu | pagina-blog | redes-sociais | etc.
  chave       VARCHAR(100) NOT NULL,     -- titulo | logo | item_01 | facebook | etc.
  valor       TEXT,                      -- texto, URL, HTML, JSON serializado
  tipo        VARCHAR(20) NOT NULL DEFAULT 'texto',  -- texto | rich_text | imagem | url | numero | json
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, secao, chave)
);
```

Seções e chaves criadas automaticamente ao cadastrar a empresa:

| Seção | Chaves |
|-------|--------|
| `frontend` | titulo, texto, logo, logo_negativo |
| `menu` | item_01 até item_10 (admin pode adicionar mais) |
| `pagina-sobre` | cabecalho, subtitulo, titulo, texto |
| `pagina-blog` | cabecalho, subtitulo, titulo |
| `pagina-contato` | cabecalho, subtitulo, titulo, texto, mapa_embed |
| `pagina-produtos` | cabecalho, subtitulo, titulo, texto |
| `pagina-404` | titulo, subtitulo, texto |
| `pagina-lgpd` | titulo, conteudo (rich_text) |
| `redes-sociais` | facebook, instagram, linkedin, youtube, tiktok, whatsapp, whatsapp_hover |
| `lgpd` | footer_texto |
| `breadcrumb` | background (imagem) |
| `secao-banner` | subtitulo_01, subtitulo_02, titulo, texto, label, background |
| `secao-banner-02` | linha_01, linha_02, label, background |
| `seo` | google_analytics, google_tag_manager, pixel_facebook |

### `temas`

Identidade visual da empresa no site público.

```sql
CREATE TABLE temas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tema_slug        VARCHAR(50) NOT NULL DEFAULT 'padrao',
  cor_primaria     VARCHAR(7) NOT NULL DEFAULT '#3B82F6',    -- hex
  cor_secundaria   VARCHAR(7) NOT NULL DEFAULT '#1E40AF',
  cor_destaque     VARCHAR(7) NOT NULL DEFAULT '#F59E0B',
  cor_texto        VARCHAR(7) NOT NULL DEFAULT '#111827',
  cor_fundo        VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  cor_header       VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  cor_footer       VARCHAR(7) NOT NULL DEFAULT '#111827',
  fonte_principal  VARCHAR(100) NOT NULL DEFAULT 'Inter',
  fonte_titulo     VARCHAR(100) NOT NULL DEFAULT 'Inter',
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Conteúdo

### `categorias`

Categorias genéricas usadas por posts e por itens. O campo `tipo` separa as duas listas.

```sql
CREATE TABLE categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        VARCHAR(200) NOT NULL,
  slug        VARCHAR(200) NOT NULL,
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('post', 'item')),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL,
  UNIQUE (empresa_id, slug, tipo)
);
```

### `posts`

Conteúdo editorial. O campo `tipo` define o rótulo exibido no painel e na URL pública.
Exemplos de uso por nicho:

| Nicho | Tipo usado |
|-------|-----------|
| Fábrica | post (blog), noticia |
| Escritório de advocacia | artigo, noticia, case |
| Clínica médica | post (dicas de saúde), noticia |
| Restaurante | post (novidades), noticia |

```sql
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo          VARCHAR(30) NOT NULL DEFAULT 'post',  -- post | noticia | artigo | case | etc.
  titulo        VARCHAR(500) NOT NULL,
  slug          VARCHAR(500) NOT NULL,
  resumo        TEXT,                                  -- texto curto para cards e meta_desc fallback
  conteudo      JSONB,                                 -- TipTap JSON (não HTML bruto)
  imagem_capa   VARCHAR(1000),                         -- URL no R2
  categoria_id  UUID REFERENCES categorias(id),
  autor         VARCHAR(200),
  publicado     BOOLEAN NOT NULL DEFAULT FALSE,
  publicado_em  TIMESTAMP NULL,
  -- SEO
  meta_title    VARCHAR(70),                           -- título para Google (max 70 chars)
  meta_desc     VARCHAR(160),                          -- descrição para Google (max 160 chars)
  og_image      VARCHAR(1000),                         -- imagem para WhatsApp/redes sociais
  og_title      VARCHAR(200),
  canonical_url VARCHAR(1000),                         -- URL canônica para evitar duplicatas
  indexavel     BOOLEAN NOT NULL DEFAULT TRUE,         -- false = noindex, nofollow
  -- Controle
  versao        INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em   TIMESTAMP NULL,
  UNIQUE (empresa_id, slug)  -- parcial: ver índice abaixo
);
```

### `itens`

Catálogo genérico. O campo `tipo_label` é exibido no painel para nomear o módulo
conforme o nicho do cliente (Produtos, Serviços, Procedimentos, Áreas de Atuação, etc.).

```sql
CREATE TABLE itens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_label    VARCHAR(100) NOT NULL DEFAULT 'Produto',  -- customizável pelo admin
  nome          VARCHAR(500) NOT NULL,
  slug          VARCHAR(500) NOT NULL,
  resumo        TEXT,
  descricao     JSONB,                     -- TipTap JSON
  imagem_url    VARCHAR(1000),             -- imagem principal
  imagens       JSONB,                     -- array de URLs: ["url1", "url2", ...]
  categoria_id  UUID REFERENCES categorias(id),
  ordem         INTEGER NOT NULL DEFAULT 0,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  versao        INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em   TIMESTAMP NULL,
  UNIQUE (empresa_id, slug)
);
```

---

## Apresentação

### `banners`

Carrossel/hero do site. Quantidade dinâmica, reordenável por drag-and-drop.

```sql
CREATE TABLE banners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo         VARCHAR(500),
  subtitulo      VARCHAR(500),
  texto          TEXT,
  label_cta      VARCHAR(100),          -- texto do botão de ação
  link_cta       VARCHAR(1000),         -- URL do botão
  imagem_url     VARCHAR(1000),         -- imagem desktop
  imagem_mobile  VARCHAR(1000),         -- imagem mobile (opcional, usa desktop se ausente)
  ordem          INTEGER NOT NULL DEFAULT 0,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em    TIMESTAMP NULL
);
```

### `destaques`

Cards de diferenciais. Ex: Qualidade, Confiança, Sustentabilidade, Experiência.
Quantidade dinâmica, reordenável.

```sql
CREATE TABLE destaques (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  descricao   TEXT,
  icone_url   VARCHAR(1000),      -- ícone como imagem
  icone_svg   TEXT,               -- SVG inline (alternativa a icone_url)
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL
);
```

### `equipe`

Membros da equipe. Útil para clínicas (médicos), escritórios (advogados), etc.

```sql
CREATE TABLE equipe (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        VARCHAR(200) NOT NULL,
  cargo       VARCHAR(200),
  bio         TEXT,
  foto_url    VARCHAR(1000),
  linkedin    VARCHAR(500),
  email       VARCHAR(200),
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL
);
```

### `depoimentos`

Avaliações e testemunhos de clientes.

```sql
CREATE TABLE depoimentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        VARCHAR(200) NOT NULL,
  cargo       VARCHAR(200),
  empresa     VARCHAR(200),
  texto       TEXT NOT NULL,
  foto_url    VARCHAR(1000),
  nota        INTEGER CHECK (nota BETWEEN 1 AND 5),
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL
);
```

### `faq`

Perguntas frequentes com respostas em texto simples.

```sql
CREATE TABLE faq (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  pergunta    VARCHAR(500) NOT NULL,
  resposta    TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL
);
```

### `galeria`

Galeria de fotos e vídeos da empresa.

```sql
CREATE TABLE galeria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo      VARCHAR(300),
  descricao   TEXT,
  url         VARCHAR(1000) NOT NULL,   -- URL no R2 (foto) ou YouTube/Vimeo (vídeo)
  tipo        VARCHAR(20) NOT NULL DEFAULT 'foto' CHECK (tipo IN ('foto', 'video')),
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em TIMESTAMP NULL
);
```

---

## Relacionamento com o Público

### `leads`

CRM básico. Registra cada contato recebido pelo formulário dos sites clientes.

```sql
CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- Dados do contato
  nome             VARCHAR(200) NOT NULL,
  email            VARCHAR(200) NOT NULL,
  telefone         VARCHAR(30),
  mensagem         TEXT,
  -- Rastreamento
  origem           VARCHAR(500),        -- URL ou nome da página de origem
  ip_origem        VARCHAR(45),         -- IPv4 ou IPv6 do visitante
  -- CRM
  respondido       BOOLEAN NOT NULL DEFAULT FALSE,
  respondido_em    TIMESTAMP NULL,
  respondido_por   UUID REFERENCES usuarios(id) NULL,
  -- LGPD
  lgpd_aceito      BOOLEAN NOT NULL DEFAULT FALSE,
  lgpd_aceito_em   TIMESTAMP NULL,
  lgpd_ip          VARCHAR(45),
  -- Controle
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em      TIMESTAMP NULL
);
```

### `contatos`

Dados de contato da empresa exibidos no site público (rodapé, página de contato).
Um registro por empresa (UNIQUE em empresa_id).

```sql
CREATE TABLE contatos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
  telefone       VARCHAR(30),
  telefone_2     VARCHAR(30),
  email          VARCHAR(200),
  whatsapp       VARCHAR(30),           -- número sem formatação: 19999304399
  whatsapp_hover VARCHAR(200),          -- texto do botão flutuante: "Fale conosco agora mesmo"
  endereco       TEXT,
  cidade         VARCHAR(200),
  estado         VARCHAR(2),
  cep            VARCHAR(9),
  mapa_embed     TEXT,                  -- URL completa do Google Maps embed
  facebook       VARCHAR(500),
  instagram      VARCHAR(500),
  linkedin       VARCHAR(500),
  youtube        VARCHAR(500),
  tiktok         VARCHAR(500),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Arquivos

### `arquivos`

Metadados de todos os arquivos enviados para o R2 do cliente.

```sql
CREATE TABLE arquivos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome_original  VARCHAR(500),           -- nome enviado pelo usuário
  nome_arquivo   VARCHAR(500) NOT NULL,  -- UUID gerado no servidor (ex: a3f8c2d1.webp)
  url            VARCHAR(1000) NOT NULL, -- URL pública no R2
  tipo           VARCHAR(20) CHECK (tipo IN ('image', 'document', 'video')),
  mime_type      VARCHAR(100),
  tamanho_bytes  BIGINT,
  largura        INTEGER NULL,           -- pixels (apenas para imagens)
  altura         INTEGER NULL,           -- pixels (apenas para imagens)
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  deletado_em    TIMESTAMP NULL
);
```

---

## Índices

### Performance e isolamento multi-tenant

Todas as queries filtram por `empresa_id`. Sem os índices abaixo, cada query
vira um full table scan que piora exponencialmente com o crescimento do banco.

```sql
-- Acesso de usuários
CREATE INDEX idx_usuarios_empresa      ON usuarios(empresa_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_usuario_perm_usuario  ON usuario_permissoes(usuario_id);

-- Configurações (leitura frequente — base do cache)
CREATE INDEX idx_configuracoes_empresa ON configuracoes(empresa_id, secao);

-- Banners (lidos em toda página inicial)
CREATE INDEX idx_banners_empresa       ON banners(empresa_id, ordem)
  WHERE deletado_em IS NULL AND ativo = TRUE;

-- Posts (queries complexas: empresa + tipo + publicado + data)
CREATE INDEX idx_posts_empresa_tipo    ON posts(empresa_id, tipo, publicado, publicado_em DESC)
  WHERE deletado_em IS NULL;

-- Itens (ordenação por empresa + ativo)
CREATE INDEX idx_itens_empresa         ON itens(empresa_id, ativo, ordem)
  WHERE deletado_em IS NULL;

-- Destaques, equipe, depoimentos, faq, galeria
CREATE INDEX idx_destaques_empresa     ON destaques(empresa_id, ordem) WHERE deletado_em IS NULL;
CREATE INDEX idx_equipe_empresa        ON equipe(empresa_id, ordem) WHERE deletado_em IS NULL;
CREATE INDEX idx_depoimentos_empresa   ON depoimentos(empresa_id, ordem) WHERE deletado_em IS NULL;
CREATE INDEX idx_faq_empresa           ON faq(empresa_id, ordem) WHERE deletado_em IS NULL;
CREATE INDEX idx_galeria_empresa       ON galeria(empresa_id, ordem) WHERE deletado_em IS NULL;

-- Leads (ordenação por data — Central de Leads + gráfico mensal)
CREATE INDEX idx_leads_empresa_data    ON leads(empresa_id, created_at DESC)
  WHERE deletado_em IS NULL;
CREATE INDEX idx_leads_respondido      ON leads(empresa_id, respondido, created_at DESC)
  WHERE deletado_em IS NULL;

-- Arquivos
CREATE INDEX idx_arquivos_empresa      ON arquivos(empresa_id, created_at DESC)
  WHERE deletado_em IS NULL;

-- Audit log (consultas do superadmin)
CREATE INDEX idx_audit_empresa         ON audit_log(empresa_id, created_at DESC);
CREATE INDEX idx_audit_usuario         ON audit_log(usuario_id, created_at DESC);

-- Refresh tokens (lookup frequente no middleware de auth)
CREATE INDEX idx_refresh_tokens_hash   ON refresh_tokens(token_hash)
  WHERE revogado = FALSE;
```

### Unicidade condicional (slugs)

```sql
-- Slug único por empresa apenas para registros não deletados
CREATE UNIQUE INDEX uq_posts_slug      ON posts(empresa_id, slug)
  WHERE deletado_em IS NULL;

CREATE UNIQUE INDEX uq_itens_slug      ON itens(empresa_id, slug)
  WHERE deletado_em IS NULL;

CREATE UNIQUE INDEX uq_categorias_slug ON categorias(empresa_id, slug, tipo)
  WHERE deletado_em IS NULL;
```

---

## Criação Automática ao Cadastrar Empresa

Quando uma nova empresa é cadastrada, o sistema cria automaticamente via `empresa_service.py`:

1. **Registro na tabela `empresas`**
2. **Registro na tabela `contatos`** (vazio, pronto para preenchimento)
3. **Registro na tabela `temas`** com as cores padrão
4. **Registros em `empresa_modulos`** — todos os módulos ativos por padrão
5. **Registros em `configuracoes`** — todas as seções padrão com valores vazios
6. **Usuário Admin** vinculado à empresa com senha temporária

Isso garante que o cliente já pode fazer login e começar a preencher o conteúdo
sem nenhuma configuração manual no banco.

---

## Migrações com Alembic

```bash
# Criar migração após alterar um model
alembic revision --autogenerate -m "adiciona campo X em posts"

# Aplicar todas as migrações pendentes
alembic upgrade head

# Ver status das migrações
alembic current

# Reverter a última migração
alembic downgrade -1

# Ver histórico
alembic history
```

Nunca alterar tabelas diretamente em produção. Toda alteração de schema
deve ser feita via migração Alembic versionada e testada em staging primeiro.
