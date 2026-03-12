# UIUX.md — Design System e UI/UX do Painel

## Filosofia de Design

O painel deve ser tão intuitivo que um cliente sem nenhum conhecimento técnico
consiga operar sozinho após um onboarding básico de 30 minutos. Cada decisão
de design prioriza:

1. **Clareza antes de elegância** — o usuário sabe o que está vendo e o que vai acontecer
2. **Feedback imediato** — toda ação tem uma resposta visual em menos de 200ms
3. **Prevenção de erros** — confirmações em ações destrutivas, validações em tempo real
4. **Consistência** — os mesmos padrões visuais e de interação em todos os módulos
5. **Mobile-first** — funcional em qualquer tamanho de tela

---

## Paleta de Cores do Painel

O painel usa uma paleta fixa (dark mode como padrão — referência: painel da Fercorr).

```
Fundo principal:    #0D0D0D  (quase preto)
Fundo de cards:     #1A1A1A
Fundo de inputs:    #141414
Bordas:             #2A2A2A
Texto principal:    #F5F5F5
Texto secundário:   #9CA3AF (gray-400)
Texto placeholder:  #6B7280 (gray-500)

Primário (ações):   #16A34A (verde — ações de confirmação, botões principais)
Destaque:           #22C55E (verde claro — badges Ativo, hover)
Perigo:             #DC2626 (vermelho — deletar, suspender)
Alerta:             #D97706 (âmbar — avisos)
Info:               #3B82F6 (azul — links, informações)

Sidebar ativa:      #22C55E (item de menu selecionado)
Sidebar inativa:    #9CA3AF
Desenvolvedor:      #F97316 (laranja — item especial no menu)
```

---

## Tipografia

```
Fonte principal: Inter (Google Fonts)
Tamanhos:
  xs:   12px — labels de badge, texto de rodapé
  sm:   14px — texto de tabela, labels de campo
  base: 16px — texto padrão, inputs
  lg:   18px — títulos de card
  xl:   20px — título de página
  2xl:  24px — título de seção principal
  3xl:  30px — números de destaque (cards de métricas)

Pesos:
  normal (400) — texto corrido
  medium (500) — labels, subtítulos
  semibold (600) — títulos de card, valores importantes
  bold (700) — título de página, números grandes
```

---

## Layout do Painel

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  [Logo]  Breadcrumb > Página         [Empresa] [Avatar]     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ SIDEBAR  │  CONTEÚDO DA PÁGINA                              │
│ (240px)  │                                                   │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ • Painel │  │ Card 1   │ │ Card 2   │ │ Card 3   │         │
│ • Banner │  └──────────┘ └──────────┘ └──────────┘         │
│ • Blog   │                                                   │
│ • ...    │  ┌──────────────────────────────────────────┐    │
│          │  │ TABELA / FORMULÁRIO                      │    │
│          │  └──────────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌────────────────────────┐
│ HEADER                 │
│ [≡]  Título  [Avatar]  │
├────────────────────────┤
│                        │
│ CONTEÚDO               │
│ (full width)           │
│                        │
│ ┌──────────┐           │
│ │ Card 1   │           │
│ └──────────┘           │
│ ┌──────────┐           │
│ │ Card 2   │           │
│ └──────────┘           │
│                        │
└────────────────────────┘

Sidebar: drawer deslizante pelo ícone ≡
Overlay escuro ao abrir o menu
```

---

## Sidebar

### Comportamento

- **Desktop:** fixa, sempre visível, largura 240px
- **Mobile:** drawer deslizante da esquerda, com overlay ao abrir
- **Recolhível** (desktop): botão `<` no rodapé recolhe para 64px (apenas ícones)
- Item ativo: destaque com cor primária (verde) + fundo levemente iluminado
- Hover: fundo sutil sem mudar a cor do texto

### Estrutura do Menu

```
[Logo da empresa]

─ Painel

─ Banners
─ Blog                    ← visível apenas se módulo ativo
─ Categorias
─ Categorias de Prod...   ← truncado com ellipsis + tooltip
─ Contatos
─ Soluções
─ Produtos
─ Central de Leads        ← destaque especial (contagem badge)

─ Contatos
── Customização           ← subitem indentado

─ Configurações
── Desenvolvedor          ← cor laranja especial

─ Arquivos
─ Temas
─ Usuários
─ Módulos
─ Versões

[Recolher <]
```

### Superadmin — seletor de empresa

No topo da sidebar, quando logado como superadmin ou em modo impersonação:

```
┌─────────────────────────────┐
│ [icone] Fercorr Embalagens  │
│          ↓ trocar empresa   │
└─────────────────────────────┘
```

Clicando abre um modal de busca com lista de todas as empresas.
Ao selecionar, troca o contexto sem fazer logout.

Quando em modo impersonação (superadmin acessando painel de cliente):
```
┌─────────────────────────────┐
│ ⚠ Modo: Fercorr Embalagens  │
│  [Voltar ao SuperAdmin]     │
└─────────────────────────────┘
```

---

## Header

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]   Home / Blog / Novo Post         [🔔] [Avatar ▼]    │
└──────────────────────────────────────────────────────────────┘
```

- **Breadcrumb** mostra o caminho navegável: `Home > Blog > Editar Post`
- **Avatar** abre dropdown com: Nome, E-mail, Meu Perfil, Sair
- **Botão de recarga** (ícone) disponível nas listagens para forçar refresh

---

## Componentes de UI

### Button

4 variantes, 3 tamanhos, com suporte a loading e disabled:

```tsx
// Variantes
<Button variant="primary">Salvar</Button>       // verde — ação principal
<Button variant="secondary">Cancelar</Button>   // cinza — ação secundária
<Button variant="danger">Deletar</Button>       // vermelho — ação destrutiva
<Button variant="ghost">Ver mais</Button>       // transparente — ação terciária

// Tamanhos
<Button size="sm">Ação</Button>
<Button size="md">Ação</Button>  // padrão
<Button size="lg">Ação</Button>

// Estados
<Button loading>Salvando...</Button>   // spinner + texto + disabled automático
<Button disabled>Indisponível</Button>

// Com ícone
<Button icon={<PlusIcon />}>Novo Registro</Button>
```

### Input e Textarea

```tsx
<FormField label="Título" error={errors.titulo?.message} required>
  <Input
    placeholder="Digite o título do post"
    {...register('titulo')}
  />
</FormField>

// Input com contador de caracteres (para SEO)
<FormField label="Meta Descrição" hint="Máx. 160 caracteres">
  <Textarea
    maxLength={160}
    showCount
    {...register('meta_desc')}
  />
</FormField>
```

### SlugField

Campo especial para slugs com geração automática e validação visual:

```tsx
<SlugField
  value={slug}
  onChange={setSlug}
  baseValue={titulo}        // gera o slug automaticamente ao digitar o título
  prefix="https://site.com.br/blog/"
  onValidate={checkSlugUnique}
/>
```

Comportamento:
- Ao digitar o título, gera o slug automaticamente (slugify)
- Usuário pode editar o slug manualmente
- Ícone de cadeado: ao clicar, desvincula o slug do título (não atualiza mais automaticamente)
- Ícone verde ✓ se slug disponível, vermelho ✗ se já existe (validação assíncrona com debounce 500ms)

### Badge de Status

```tsx
<Badge variant="active">Ativo</Badge>      // verde
<Badge variant="inactive">Inativo</Badge>  // cinza
<Badge variant="draft">Rascunho</Badge>    // âmbar
<Badge variant="published">Publicado</Badge> // verde escuro
```

### Modal e ConfirmDialog

```tsx
// Modal genérico
<Modal isOpen={open} onClose={() => setOpen(false)} title="Editar Banner">
  <conteúdo />
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button variant="primary" loading={saving} onClick={handleSave}>Salvar</Button>
  </ModalFooter>
</Modal>

// Confirmação de exclusão (sempre antes de deletar)
<ConfirmDialog
  isOpen={confirmOpen}
  title="Deletar post"
  message='Tem certeza que deseja deletar "Como escolher a embalagem certa"? Esta ação não pode ser desfeita.'
  confirmLabel="Sim, deletar"
  confirmVariant="danger"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

### Skeleton (Loading State)

Exibido durante o carregamento inicial de qualquer listagem ou dado:

```tsx
// Lista com skeleton
{loading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-md" />
    ))}
  </div>
) : (
  <DataTable data={posts} columns={columns} />
)}

// Card de métrica com skeleton
{loading ? (
  <StatsCard loading />
) : (
  <StatsCard title="Total de Leads" value={1345} icon={<UsersIcon />} />
)}
```

### EmptyState

Exibido quando uma lista está vazia:

```tsx
<EmptyState
  icon={<DocumentTextIcon />}
  title="Nenhum post encontrado"
  description="Crie seu primeiro post para começar a publicar conteúdo."
  action={
    <Button variant="primary" icon={<PlusIcon />} onClick={() => navigate('/posts/novo')}>
      Criar primeiro post
    </Button>
  }
/>
```

---

## DataTable (Tabela de Dados)

Padrão visual seguido em todos os módulos de listagem:

```
┌─────────────────────────────────────────────────────────────────┐
│  + Novo Registro   [Limpar filtros]  [Limpar filtros/ordenações] │
│                                            [Exportar CSV] (leads)│
├──────────────────┬──────────────────────┬──────────────────────┤
│ ≡  Título      🔍│  Status  ↕           │  Opções              │
├──────────────────┼──────────────────────┼──────────────────────┤
│ ≡  Post 01       │  [Ativo]             │  Editar│Visualizar│Deletar│
│ ≡  Post 02       │  [Rascunho]          │  Editar│Visualizar│Deletar│
│ ≡  Post 03       │  [Ativo]             │  Editar│Visualizar│Deletar│
├──────────────────┴──────────────────────┴──────────────────────┤
│                        1-10 de 24 itens  [<] [1] [2] [3] [>]  │
│                                          10/página ▾           │
└─────────────────────────────────────────────────────────────────┘
```

- **≡** (drag handle) — visível apenas em tabelas com reordenação
- **🔍** (ícone de busca na coluna) — abre input inline para busca naquela coluna
- **↕** (ícone na header) — indica que a coluna é ordenável; clique alterna asc/desc
- **▾ filtro** — ícone de funil abre dropdown de filtros na coluna de Status
- **Ações** separadas por `|` vertical
- **Paginação** no rodapé com seletor de itens por página (10, 20, 50)

### Responsividade da Tabela

Mobile: colunas menos importantes são ocultadas, ações ficam em menu `...`:

```
Mobile:
┌──────────────────────────────┐
│ Título do Post           [⋮] │
│ Ativo • 15/09/2025           │
├──────────────────────────────┤
│ Outro Post               [⋮] │
│ Rascunho • 10/09/2025        │
└──────────────────────────────┘
```

---

## Formulários

### Layout padrão de formulário

```
┌─────────────────────────────────────────────────────┐
│ Título da Página                                    │
│                                                     │
│ ─── Informações básicas ─────────────────────────── │
│                                                     │
│ Título *                                            │
│ ┌────────────────────────────────────────────────┐  │
│ │                                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                     │
│ Slug *           [🔒 desvinculado do título]         │
│ site.com.br/blog/[meu-post-aqui          ] ✓        │
│                                                     │
│ Categoria                    Status                 │
│ ┌──────────────────────┐     ┌──────────────────┐   │
│ │ Selecione...       ▾ │     │ Publicado      ▾ │   │
│ └──────────────────────┘     └──────────────────┘   │
│                                                     │
│ Imagem de Capa                                      │
│ ┌─────────────────────────────────────────┐         │
│ │  [preview da imagem]   [trocar] [remov] │         │
│ └─────────────────────────────────────────┘         │
│                                                     │
│ ─── Conteúdo ─────────────────────────────────────  │
│ [Editor TipTap com toolbar]                         │
│                                                     │
│ ─── SEO ──────────────────────────────────────────  │
│ Meta Título (70 chars)         [48/70]              │
│ Meta Descrição (160 chars)     [102/160]            │
│ Indexável    [● On]                                 │
│                                                     │
│            [Cancelar]  [Salvar como rascunho]  [Publicar] │
└─────────────────────────────────────────────────────┘
```

### Validação em tempo real

- Campos obrigatórios mostram `*` no label
- Erro aparece abaixo do campo ao sair (onBlur) ou ao tentar enviar
- Cor da borda muda: cinza (normal) → vermelho (erro) → verde (válido)
- Contadores de caracteres em campos com limite (SEO)

### Upload de Imagem

```
Estado vazio:
┌──────────────────────────────────────────┐
│                                          │
│       📸  Arraste uma imagem aqui        │
│           ou clique para selecionar      │
│                                          │
│       JPG, PNG, WebP ou GIF • Máx. 10MB  │
└──────────────────────────────────────────┘

Durante upload:
┌──────────────────────────────────────────┐
│     [preview borrado]                    │
│     ████████░░░░░░░░  60%                │
└──────────────────────────────────────────┘

Após upload:
┌──────────────────────────────────────────┐
│  [thumbnail da imagem]  banner-01.webp   │
│  1200 × 800px • 45 KB                   │
│  [Trocar imagem]  [Remover]              │
└──────────────────────────────────────────┘
```

---

## Editor Rich Text (TipTap)

### Toolbar completa

```
┌────────────────────────────────────────────────────────────────┐
│ ↩ ↪  [Tamanho ▾]  [Altura ▾]  [Espaçamento ▾]                │
│ A  B  I  U  S  A↑  A↓  ✕  😊  ═  ║  ≡                        │
│ ≡  ≡  ≡  [Normal ▾]  • ▪ " <> ❝  🔗  🔓  —  ≡  ⤢            │
└────────────────────────────────────────────────────────────────┘
```

Controles: desfazer/refazer, tamanho de fonte, altura de linha,
espaçamento entre letras, cor do texto, bold, itálico, sublinhado,
tachado, superscript, subscript, limpar formatação, emoji, alinhamento,
indentação, lista não ordenada/ordenada, citação, código inline,
bloco de código, link, remover link, divisor, alinhamentos, fullscreen.

### Modo Fullscreen

O editor pode expandir para tela cheia para facilitar a edição de
conteúdos longos. Ícone ⤢ no canto direito da toolbar.

---

## Central de Leads — Tela Completa

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Central de Leads                [Recarregar]  [Reportar Erro] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [GRÁFICO DE BARRAS — leads por mês — ano atual]                 │
│  jan  fev  mar  abr  mai  jun  jul  ago  set  out  nov  dez      │
│   68  133  112   97   74  103  102  140  201  147  116   52      │
│                                                                  │
├──────┬───────────────┬────────────────┬─────────────────────────┤
│ Leads│  Leads        │  Últimos       │  Contatos               │
│Ativos│  respondidos  │  30 dias       │  Recebidos              │
│      │               │                │                         │
│ ↓ 0  │ ↑ 1.345/1.345 │ ↑ 52 lead(s)  │ ⟳ 1.345 lead(s)        │
│/1.345│               │                │                         │
├──────┴───────────────┴────────────────┴─────────────────────────┤
│ [Limpar filtros]  [Limpar filtros e ordenações]  [Exportar .csv] │
├──────────────────────────┬──────────────────────┬───────────────┤
│ ≡  Nome               🔍 │  Email             🔍 │  Opções      │
├──────────────────────────┼──────────────────────┼───────────────┤
│ ≡  Junior Souza          │  junior@empresa.com  │ Ed│Vis│Del    │
│ ≡  Rafael Campos         │  rafael@gmail.com    │ Ed│Vis│Del    │
│ ≡  Giovane Martins Serra  │  giovane@gmail.com   │ Ed│Vis│Del    │
└──────────────────────────┴──────────────────────┴───────────────┘
                                1-10 de 1345  [<] [1][2]...[135] [>]
```

### Modal de Visualização do Lead

```
┌────────────────────────────────────────────┐
│ Lead — Junior Souza               [✕ fechar]│
├────────────────────────────────────────────┤
│ Nome:      Junior Souza                    │
│ Email:     junior@sanchez.ppg.br           │
│ Telefone:  (19) 99999-0000                 │
│ Mensagem:  Gostaria de um orçamento...     │
│ Origem:    /contato                        │
│ Data:      12/03/2026 às 15:23             │
│ LGPD:      ✓ Aceito em 12/03/2026         │
│ Status:    [Pendente]                      │
│                                            │
│     [Marcar como Respondido]    [Fechar]   │
└────────────────────────────────────────────┘
```

---

## Tela de Configurações

### Layout de abas

```
┌─────────────────────────────────────────────────────────────────┐
│  Configurações                                                  │
│                                                                 │
│  [Breadcrumb] [Frontend] [LGPD] [Menu] [Pág.404] [Pág.Blog]   │
│  [Pág.Contato] [Pág.LGPD] [Pág.Produtos] [Pág.Sobre] [Redes]  │
│  [Seção-Banner] [Seção-Banner-02] ...                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Conteúdo da aba ativa]                                        │
│                                                                 │
│                                    [💾 Atualizar dados]         │
│                                                                 │
│  ═══  Ou  ════════════════════════════════════════════════════  │
│                                                                 │
│  Inserir nova configuração                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  + Novo Registro                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│  [Enviar]                                                       │
└─────────────────────────────────────────────────────────────────┘
```

As abas são renderizadas dinamicamente com base nas seções cadastradas no banco.
O botão "Inserir nova configuração" permite adicionar chaves customizadas.

---

## Tela de Módulos

```
┌────────────────────────────────────────────────────┐
│  Módulos                                           │
│  Ative ou desative funcionalidades do site         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Banners          Carrossel do site   [● Ativo]   │
│  Blog             Posts e artigos     [● Ativo]   │
│  Produtos         Catálogo            [● Ativo]   │
│  Equipe           Time da empresa     [○ Inativo] │
│  Depoimentos      Avaliações          [● Ativo]   │
│  FAQ              Perguntas freq.     [○ Inativo] │
│  Galeria          Fotos da estrutura  [○ Inativo] │
│  ...                                              │
│                                                   │
│  ℹ Módulos inativos não aparecem no site          │
│    nem no menu deste painel.                      │
└────────────────────────────────────────────────────┘
```

Toggle visual instantâneo. Confirmação antes de desativar um módulo
que já tem conteúdo cadastrado.

---

## Tela de Usuários e Permissões

```
┌──────────────────────────────────────────────────────────────────┐
│  Usuários                                  [+ Novo Usuário]      │
├─────────────────┬────────────┬────────────┬──────────────────────┤
│ Nome          🔍│ Email    🔍│ Papel      │ Opções               │
├─────────────────┼────────────┼────────────┼──────────────────────┤
│ João Silva      │ joao@...   │ [Admin]    │ Editar│Deletar       │
│ Maria Costa     │ maria@...  │ [Usuário]  │ Editar│Deletar       │
└─────────────────┴────────────┴────────────┴──────────────────────┘
```

### Modal de Permissões (role: usuario)

```
┌──────────────────────────────────────────────────────────────────┐
│  Permissões — Maria Costa                                        │
├─────────────────┬───────┬────────┬────────┬─────────┬───────────┤
│ Módulo          │  Ver  │ Criar  │ Editar │ Deletar │ Exportar  │
├─────────────────┼───────┼────────┼────────┼─────────┼───────────┤
│ Posts           │  ✓    │   ✓    │   ✓    │   ✗     │    —      │
│ Categorias      │  ✓    │   ✗    │   ✗    │   ✗     │    —      │
│ Produtos        │  ✓    │   ✓    │   ✓    │   ✗     │    —      │
│ Leads           │  ✓    │   —    │   ✓    │   ✗     │    ✗      │
│ Arquivos        │  ✓    │   ✓    │   —    │   ✗     │    —      │
│ Configurações   │  ✓    │   —    │   ✓    │   —     │    —      │
└─────────────────┴───────┴────────┴────────┴─────────┴───────────┘

  ─ = ação não aplicável ao módulo

                              [Cancelar]  [Salvar permissões]
└──────────────────────────────────────────────────────────────────┘
```

---

## Toast Notifications

Posição: canto superior direito, empilháveis.

```
✓ Post publicado com sucesso!              [✕]   ← verde
✕ Erro ao salvar. Tente novamente.         [✕]   ← vermelho
⚠ Slug já existe. Escolha outro nome.      [✕]   ← âmbar
ℹ Módulo desativado. O conteúdo foi salvo. [✕]   ← azul
```

Duração: 4 segundos (erros: 6 segundos, pois precisam ser lidos).
Clique no ✕ fecha imediatamente.

---

## Responsividade — Breakpoints

| Breakpoint | Tailwind | Comportamento |
|-----------|---------|---------------|
| < 640px | mobile | sidebar como drawer; tabela como cards; formulários full width |
| 640–1023px | tablet | sidebar recolhida (64px ícones); tabela com colunas reduzidas |
| ≥ 1024px | desktop | sidebar completa (240px); layout de 2 colunas nos formulários |

### Prioridades mobile

1. **Central de Leads** — gráfico scrollável horizontalmente; cards em coluna única
2. **Editor TipTap** — toolbar condensada em mobile (botões mais usados visíveis, resto em `...`)
3. **Tabelas** — colunas auxiliares ocultadas; ações em menu `⋮`
4. **Formulários** — campos em coluna única (não 2 colunas lado a lado)
5. **Upload de imagem** — toque para abrir galeria do dispositivo

---

## Acessibilidade

- Contraste mínimo 4.5:1 entre texto e fundo (WCAG AA)
- Todos os inputs com `label` associado via `htmlFor`
- Ícones decorativos com `aria-hidden="true"`
- Modais com `role="dialog"` e foco preso dentro do modal ao abrir
- Keyboard navigation: Tab entre campos, Enter para confirmar, Escape para fechar modais
- Loading states anunciados com `aria-live="polite"`
- Tabelas com `scope="col"` nas headers

---

## Página de Login

```
┌───────────────────────────────────────┐
│                                       │
│         [Logo do CMS]                 │
│         Painel Administrativo         │
│                                       │
│  E-mail                               │
│  ┌─────────────────────────────────┐  │
│  │ seu@email.com                   │  │
│  └─────────────────────────────────┘  │
│                                       │
│  Senha                                │
│  ┌─────────────────────────────────┐  │
│  │ ••••••••••••         [👁 ver]    │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [          Entrar          ]         │
│                                       │
│  Esqueci minha senha                  │
│                                       │
└───────────────────────────────────────┘
```

- Sem opção de cadastro (contas criadas apenas pelo admin/superadmin)
- Feedback de erro: "E-mail ou senha incorretos" (não indica qual campo)
- Após 5 tentativas: "Muitas tentativas. Tente novamente em 15 minutos."
- Botão do olho para revelar/ocultar senha
- Enter no campo de senha faz login

---

## Estado de Impersonação (SuperAdmin)

Quando o superadmin está navegando no painel de um cliente, exibir
banner vermelho permanente no topo para evitar confusão:

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠  Você está visualizando como: Fercorr Embalagens          [Sair]│
└──────────────────────────────────────────────────────────────────┘
```

O `[Sair]` retorna ao contexto do superadmin sem fazer logout.
