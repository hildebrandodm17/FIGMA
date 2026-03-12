# PLANO.md — Plano de Execução do CMS Headless Multi-tenant

## Legenda
- [ ] Pendente
- [~] Em andamento
- [x] Concluído

---

## FASE 1 — Fundação do Backend (core + models + schemas) ✅

### 1.1 Estrutura e configuração
- [x] `cms-backend/requirements.txt` — todas as dependências com versões
- [x] `cms-backend/.env.example` — variáveis de ambiente documentadas
- [x] `cms-backend/app/__init__.py`
- [x] `cms-backend/app/core/__init__.py`
- [x] `cms-backend/app/core/config.py` — Settings com pydantic-settings (DATABASE_URL, JWT_*, FERNET_KEY, etc.)
- [x] `cms-backend/app/core/database.py` — engine async, session factory, connection pooling
- [x] `cms-backend/app/core/security.py` — JWT create/verify, bcrypt hash/verify, Fernet encrypt/decrypt
- [x] `cms-backend/app/core/cache.py` — TTLCache wrapper (configs, empresas, módulos)
- [x] `cms-backend/app/core/storage.py` — R2 client factory por empresa (boto3 S3-compatible)

### 1.2 Models SQLAlchemy (ORM)
- [x] `cms-backend/app/models/__init__.py` — exporta todos os models
- [x] `cms-backend/app/models/base.py` — BaseModel com id UUID, created_at, updated_at, deletado_em
- [x] `cms-backend/app/models/empresa.py` — Empresa (tabela raiz)
- [x] `cms-backend/app/models/usuario.py` — Usuario + UsuarioPermissao + RefreshToken
- [x] `cms-backend/app/models/configuracao.py` — Configuracao + Tema
- [x] `cms-backend/app/models/conteudo.py` — Post + Categoria
- [x] `cms-backend/app/models/item.py` — Item (+ CategoriaItem se aplicável)
- [x] `cms-backend/app/models/apresentacao.py` — Banner + Destaque + Equipe + Depoimento + Faq + Galeria
- [x] `cms-backend/app/models/lead.py` — Lead
- [x] `cms-backend/app/models/contato.py` — Contato
- [x] `cms-backend/app/models/arquivo.py` — Arquivo
- [x] `cms-backend/app/models/audit.py` — AuditLog
- [x] `cms-backend/app/models/empresa_modulo.py` — EmpresaModulo

### 1.3 Schemas Pydantic v2
- [x] `cms-backend/app/schemas/__init__.py`
- [x] `cms-backend/app/schemas/base.py` — PaginatedResponse, ErrorResponse, PaginationParams
- [x] `cms-backend/app/schemas/auth.py` — LoginRequest, TokenResponse
- [x] `cms-backend/app/schemas/empresa.py` — EmpresaCreate, EmpresaUpdate, EmpresaResponse
- [x] `cms-backend/app/schemas/usuario.py` — UsuarioCreate, UsuarioUpdate, UsuarioResponse, PermissaoSchema
- [x] `cms-backend/app/schemas/configuracao.py` — ConfiguracaoResponse, ConfiguracaoUpdate, TemaResponse, TemaUpdate
- [x] `cms-backend/app/schemas/conteudo.py` — PostCreate, PostUpdate, PostResponse, CategoriaCreate, etc.
- [x] `cms-backend/app/schemas/item.py` — ItemCreate, ItemUpdate, ItemResponse
- [x] `cms-backend/app/schemas/apresentacao.py` — Banner/Destaque/Equipe/Depoimento/Faq/Galeria schemas
- [x] `cms-backend/app/schemas/lead.py` — LeadCreate, LeadUpdate, LeadResponse
- [x] `cms-backend/app/schemas/contato.py` — ContatoResponse, ContatoUpdate
- [x] `cms-backend/app/schemas/arquivo.py` — ArquivoResponse, ArquivoUploadResponse

### 1.4 Utils
- [x] `cms-backend/app/utils/__init__.py`
- [x] `cms-backend/app/utils/image.py` — magic bytes validation, resize + WebP via Pillow
- [x] `cms-backend/app/utils/sanitize.py` — bleach whitelist para TipTap HTML
- [x] `cms-backend/app/utils/slug.py` — gerar slug único por empresa
- [x] `cms-backend/app/utils/pagination.py` — helper de paginação para queries

---

## FASE 2 — Dependencies e Middlewares ✅

### 2.1 Dependencies (injeção de dependências FastAPI)
- [x] `cms-backend/app/core/dependencies.py` — get_db, get_current_user, require_role, check_permissao, get_empresa_from_slug, verificar_modulo_ativo

### 2.2 Middlewares
- [x] `cms-backend/app/middleware/__init__.py`
- [x] `cms-backend/app/middleware/cors.py` — CORS dinâmico por domínio cadastrado
- [x] `cms-backend/app/middleware/rate_limit.py` — slowapi com limites por endpoint
- [x] `cms-backend/app/middleware/audit.py` — registrar ações de escrita no audit_log

---

## FASE 3 — Services (lógica de negócio) ✅

- [x] `cms-backend/app/services/__init__.py`
- [x] `cms-backend/app/services/auth_service.py` — login, refresh, logout, validação de token roubado
- [x] `cms-backend/app/services/empresa_service.py` — criar empresa com provisão automática (contato, tema, módulos, configs, admin)
- [x] `cms-backend/app/services/storage_service.py` — upload para R2, delete, listagem
- [x] `cms-backend/app/services/lead_service.py` — salvar lead, notificar email, disparar webhook com HMAC
- [x] `cms-backend/app/services/seo_service.py` — gerar sitemap.xml, robots.txt, og tags
- [x] `cms-backend/app/services/configuracao_service.py` — ler/escrever configs por seção, invalidar cache
- [x] `cms-backend/app/services/notificacao_service.py` — envio de email via Resend

---

## FASE 4 — Routers (endpoints da API) ✅

### 4.1 Auth
- [x] `cms-backend/app/api/__init__.py`
- [x] `cms-backend/app/api/v1/__init__.py`
- [x] `cms-backend/app/api/v1/auth/__init__.py`
- [x] `cms-backend/app/api/v1/auth/router.py` — POST /login, /refresh, /logout
- [x] `cms-backend/app/api/v1/auth/schemas.py` — (pode reusar app/schemas/auth.py se suficiente)

### 4.2 Public (sites públicos)
- [x] `cms-backend/app/api/v1/public/__init__.py`
- [x] `cms-backend/app/api/v1/public/router.py` — registra sub-routers
- [x] `cms-backend/app/api/v1/public/config.py` — GET /site/config, /sitemap.xml, /robots.txt
- [x] `cms-backend/app/api/v1/public/conteudo.py` — GET /site/posts, /site/posts/{slug}
- [x] `cms-backend/app/api/v1/public/itens.py` — GET /site/itens, /site/itens/{slug}
- [x] `cms-backend/app/api/v1/public/banners.py`
- [x] `cms-backend/app/api/v1/public/destaques.py`
- [x] `cms-backend/app/api/v1/public/equipe.py`
- [x] `cms-backend/app/api/v1/public/depoimentos.py`
- [x] `cms-backend/app/api/v1/public/faq.py`
- [x] `cms-backend/app/api/v1/public/galeria.py`
- [x] `cms-backend/app/api/v1/public/leads.py` — POST /site/leads

### 4.3 Admin (painel autenticado)
- [x] `cms-backend/app/api/v1/admin/__init__.py`
- [x] `cms-backend/app/api/v1/admin/router.py` — registra sub-routers
- [x] `cms-backend/app/api/v1/admin/dashboard.py` — GET /admin/dashboard
- [x] `cms-backend/app/api/v1/admin/banners.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/posts.py` — CRUD
- [x] `cms-backend/app/api/v1/admin/categorias.py` — CRUD
- [x] `cms-backend/app/api/v1/admin/itens.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/destaques.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/equipe.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/depoimentos.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/faq.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/galeria.py` — CRUD + reordenar
- [x] `cms-backend/app/api/v1/admin/leads.py` — listar, detalhe, marcar respondido, exportar CSV, gráfico
- [x] `cms-backend/app/api/v1/admin/contatos.py` — GET + PUT
- [x] `cms-backend/app/api/v1/admin/arquivos.py` — upload, listar, deletar
- [x] `cms-backend/app/api/v1/admin/configuracoes.py` — GET/PUT por seção + nova chave
- [x] `cms-backend/app/api/v1/admin/temas.py` — GET + PUT
- [x] `cms-backend/app/api/v1/admin/usuarios.py` — CRUD com permissões
- [x] `cms-backend/app/api/v1/admin/modulos.py` — listar + ativar/desativar

### 4.4 SuperAdmin
- [x] `cms-backend/app/api/v1/superadmin/__init__.py`
- [x] `cms-backend/app/api/v1/superadmin/router.py`
- [x] `cms-backend/app/api/v1/superadmin/empresas.py` — CRUD + suspender/ativar + impersonar
- [x] `cms-backend/app/api/v1/superadmin/dashboard.py` — visão geral de todas as empresas

---

## FASE 5 — main.py e Alembic ✅

- [x] `cms-backend/main.py` — app FastAPI, registro de todos os routers, middlewares, security headers, startup/shutdown
- [x] `cms-backend/alembic.ini` — configuração do Alembic
- [x] `cms-backend/alembic/env.py` — importa todos os models para autogenerate
- [x] `cms-backend/alembic/versions/` — diretório de migrações (vazio inicialmente)

---

## FASE 6 — Frontend Admin — Infraestrutura ✅

### 6.1 Setup do projeto
- [x] `cms-admin/package.json` — dependências do projeto
- [x] `cms-admin/vite.config.ts`
- [x] `cms-admin/tsconfig.json`
- [x] `cms-admin/tailwind.config.ts` — paleta dark mode do painel
- [x] `cms-admin/postcss.config.js`
- [x] `cms-admin/index.html`
- [x] `cms-admin/.env.example`
- [x] `cms-admin/src/main.tsx` — entry point
- [x] `cms-admin/src/App.tsx`
- [x] `cms-admin/src/index.css` — Tailwind imports + custom styles

### 6.2 Tipos TypeScript
- [x] `cms-admin/src/types/index.ts` — interfaces espelhando os schemas do backend

### 6.3 Estado global (Zustand)
- [x] `cms-admin/src/store/authStore.ts` — usuario, tokens, role
- [x] `cms-admin/src/store/empresaStore.ts` — empresa ativa (superadmin)

### 6.4 Services (API)
- [x] `cms-admin/src/services/api.ts` — axios instance + interceptors (auth + refresh automático)
- [x] `cms-admin/src/services/authService.ts`
- [x] `cms-admin/src/services/bannerService.ts`
- [x] `cms-admin/src/services/postService.ts`
- [x] `cms-admin/src/services/categoriaService.ts`
- [x] `cms-admin/src/services/itemService.ts`
- [x] `cms-admin/src/services/destaqueService.ts`
- [x] `cms-admin/src/services/equipeService.ts`
- [x] `cms-admin/src/services/depoimentoService.ts`
- [x] `cms-admin/src/services/faqService.ts`
- [x] `cms-admin/src/services/galeriaService.ts`
- [x] `cms-admin/src/services/leadService.ts`
- [x] `cms-admin/src/services/contatoService.ts`
- [x] `cms-admin/src/services/arquivoService.ts`
- [x] `cms-admin/src/services/configuracaoService.ts`
- [x] `cms-admin/src/services/temaService.ts`
- [x] `cms-admin/src/services/usuarioService.ts`
- [x] `cms-admin/src/services/moduloService.ts`
- [x] `cms-admin/src/services/empresaService.ts` — superadmin

### 6.5 Hooks
- [x] `cms-admin/src/hooks/useAuth.ts` — login, logout, usuário atual
- [x] `cms-admin/src/hooks/useEmpresa.ts` — empresa ativa (superadmin)
- [x] `cms-admin/src/hooks/usePermissao.ts` — verificar permissão: (modulo, acao) => bool

### 6.6 Utils
- [x] `cms-admin/src/utils/formatDate.ts`
- [x] `cms-admin/src/utils/formatFileSize.ts`
- [x] `cms-admin/src/utils/generateSlug.ts`

### 6.7 Router
- [x] `cms-admin/src/router.tsx` — React Router v6 com guards de auth e permissão

---

## FASE 7 — Frontend Admin — Componentes UI ✅

### 7.1 Componentes genéricos (ui/)
- [x] `cms-admin/src/components/ui/Button.tsx`
- [x] `cms-admin/src/components/ui/Input.tsx`
- [x] `cms-admin/src/components/ui/Textarea.tsx`
- [x] `cms-admin/src/components/ui/Select.tsx`
- [x] `cms-admin/src/components/ui/Toggle.tsx`
- [x] `cms-admin/src/components/ui/Badge.tsx`
- [x] `cms-admin/src/components/ui/Modal.tsx`
- [x] `cms-admin/src/components/ui/ConfirmDialog.tsx`
- [x] `cms-admin/src/components/ui/Tooltip.tsx`
- [x] `cms-admin/src/components/ui/Skeleton.tsx`
- [x] `cms-admin/src/components/ui/EmptyState.tsx`
- [x] `cms-admin/src/components/ui/Spinner.tsx`

### 7.2 Layout
- [x] `cms-admin/src/components/layout/Sidebar.tsx`
- [x] `cms-admin/src/components/layout/Header.tsx`
- [x] `cms-admin/src/components/layout/PageWrapper.tsx`
- [x] `cms-admin/src/components/layout/MobileNav.tsx`

### 7.3 Formulários
- [x] `cms-admin/src/components/forms/FormField.tsx`
- [x] `cms-admin/src/components/forms/ImageUpload.tsx`
- [x] `cms-admin/src/components/forms/MultiImageUpload.tsx`
- [x] `cms-admin/src/components/forms/SlugField.tsx`
- [x] `cms-admin/src/components/forms/ColorPicker.tsx`
- [x] `cms-admin/src/components/forms/SelectCategoria.tsx`

### 7.4 Editor Rich Text
- [x] `cms-admin/src/components/editor/RichEditor.tsx`
- [x] `cms-admin/src/components/editor/EditorToolbar.tsx`

### 7.5 Tabela de Dados
- [x] `cms-admin/src/components/table/DataTable.tsx`
- [x] `cms-admin/src/components/table/Pagination.tsx`
- [x] `cms-admin/src/components/table/SortableRow.tsx`
- [x] `cms-admin/src/components/table/TableActions.tsx`

### 7.6 Charts e SEO
- [x] `cms-admin/src/components/charts/LeadsBarChart.tsx`
- [x] `cms-admin/src/components/charts/StatsCard.tsx`
- [x] `cms-admin/src/components/seo/SeoFields.tsx`

---

## FASE 8 — Frontend Admin — Páginas ✅

### 8.1 Auth e Dashboard
- [x] `cms-admin/src/pages/auth/Login.tsx`
- [x] `cms-admin/src/pages/dashboard/Dashboard.tsx`

### 8.2 Módulos de conteúdo
- [x] `cms-admin/src/pages/banners/BannerList.tsx`
- [x] `cms-admin/src/pages/banners/BannerForm.tsx`
- [x] `cms-admin/src/pages/posts/PostList.tsx`
- [x] `cms-admin/src/pages/posts/PostForm.tsx`
- [x] `cms-admin/src/pages/categorias/CategoriaList.tsx`
- [x] `cms-admin/src/pages/categorias/CategoriaForm.tsx`
- [x] `cms-admin/src/pages/itens/ItemList.tsx`
- [x] `cms-admin/src/pages/itens/ItemForm.tsx`
- [x] `cms-admin/src/pages/destaques/DestaqueList.tsx`
- [x] `cms-admin/src/pages/destaques/DestaqueForm.tsx`
- [x] `cms-admin/src/pages/equipe/EquipeList.tsx`
- [x] `cms-admin/src/pages/equipe/EquipeForm.tsx`
- [x] `cms-admin/src/pages/depoimentos/DepoimentoList.tsx`
- [x] `cms-admin/src/pages/depoimentos/DepoimentoForm.tsx`
- [x] `cms-admin/src/pages/faq/FaqList.tsx`
- [x] `cms-admin/src/pages/faq/FaqForm.tsx`
- [x] `cms-admin/src/pages/galeria/GaleriaPage.tsx`

### 8.3 Leads (CRM)
- [x] `cms-admin/src/pages/leads/LeadList.tsx`
- [x] `cms-admin/src/pages/leads/LeadDetail.tsx`

### 8.4 Gestão e configuração
- [x] `cms-admin/src/pages/contatos/ContatosForm.tsx`
- [x] `cms-admin/src/pages/arquivos/ArquivosPage.tsx`
- [x] `cms-admin/src/pages/configuracoes/ConfiguracoesPage.tsx`
- [x] `cms-admin/src/pages/temas/TemasPage.tsx`
- [x] `cms-admin/src/pages/usuarios/UsuarioList.tsx`
- [x] `cms-admin/src/pages/usuarios/UsuarioForm.tsx`
- [x] `cms-admin/src/pages/modulos/ModulosPage.tsx`

### 8.5 SuperAdmin
- [x] `cms-admin/src/pages/superadmin/EmpresaList.tsx`
- [x] `cms-admin/src/pages/superadmin/EmpresaForm.tsx`
- [x] `cms-admin/src/pages/superadmin/EmpresaSwitch.tsx`

---

## FASE 9 — Testes Backend ✅

- [x] `cms-backend/tests/__init__.py`
- [x] `cms-backend/tests/conftest.py` — fixtures: db, client, empresa, usuários
- [x] `cms-backend/tests/api/test_auth.py`
- [x] `cms-backend/tests/api/test_leads.py`
- [x] `cms-backend/tests/api/test_posts.py`
- [x] `cms-backend/tests/services/test_storage.py`

---

## Resumo por fase

| Fase | Arquivos | Descrição | Status |
|------|----------|-----------|--------|
| 1 | ~30 | Core backend: config, models, schemas, utils | ✅ |
| 2 | ~4 | Dependencies e middlewares | ✅ |
| 3 | ~8 | Services (lógica de negócio) | ✅ |
| 4 | ~30 | Routers (todos os endpoints da API) | ✅ |
| 5 | ~4 | main.py e Alembic | ✅ |
| 6 | ~30 | Frontend: setup, types, stores, services, hooks, utils, router | ✅ |
| 7 | ~25 | Frontend: componentes UI reutilizáveis | ✅ |
| 8 | ~30 | Frontend: todas as páginas | ✅ |
| 9 | ~5 | Testes backend | ✅ |
| **Total** | **~166** | | **✅ COMPLETO** |

---

## Notas importantes

- Cada módulo admin (banners, posts, itens, etc.) segue o mesmo padrão CRUD — após fazer o primeiro (banners), os demais são replicados com adaptações
- O frontend público NÃO faz parte deste escopo — é um projeto independente por cliente
- Prioridade: backend funcional → frontend funcional → testes
