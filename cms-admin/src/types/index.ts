// ── Respostas padronizadas da API ────────────────────────

export interface PaginationMeta {
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}

export interface ErrorResponse {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes?: any;
  };
}

// ── Autenticacao e Usuarios ──────────────────────────────

export interface Permissao {
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
  pode_exportar: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'superadmin' | 'admin' | 'usuario';
  empresa_id?: string;
  empresa_nome?: string;
  permissoes: Permissao[];
  ativo: boolean;
  ultimo_acesso?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expira_em: number;
  usuario: Usuario;
}

// ── Empresa ──────────────────────────────────────────────

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  dominio?: string;
  plano: string;
  ativo: boolean;
  r2_bucket_name?: string;
  r2_public_url?: string;
  webhook_leads?: string;
  created_at: string;
  updated_at: string;
}

export interface EmpresaModulo {
  modulo: string;
  ativo: boolean;
}

// ── Banners ──────────────────────────────────────────────

export interface Banner {
  id: string;
  titulo?: string;
  subtitulo?: string;
  texto?: string;
  label_cta?: string;
  link_cta?: string;
  imagem_url?: string;
  imagem_mobile?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

// ── Conteudo (Posts) ─────────────────────────────────────

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  tipo: string;
  ativo: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  tipo: string;
  titulo: string;
  slug: string;
  resumo?: string;
  conteudo?: string;
  imagem_capa?: string;
  categoria?: Categoria;
  autor?: string;
  publicado: boolean;
  publicado_em?: string;
  versao: number;
  meta_title?: string;
  meta_desc?: string;
  og_image?: string;
  og_title?: string;
  canonical_url?: string;
  indexavel: boolean;
  created_at: string;
  updated_at: string;
}

// ── Itens ────────────────────────────────────────────────

export interface Item {
  id: string;
  tipo_label: string;
  nome: string;
  slug: string;
  resumo?: string;
  descricao?: string;
  imagem_url?: string;
  imagens?: string[];
  categoria?: Categoria;
  ordem: number;
  ativo: boolean;
  versao: number;
  created_at: string;
  updated_at: string;
}

// ── Apresentacao ─────────────────────────────────────────

export interface Destaque {
  id: string;
  titulo: string;
  descricao?: string;
  icone_url?: string;
  icone_svg?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Equipe {
  id: string;
  nome: string;
  cargo?: string;
  bio?: string;
  foto_url?: string;
  linkedin?: string;
  email?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Depoimento {
  id: string;
  nome: string;
  cargo?: string;
  empresa?: string;
  texto: string;
  foto_url?: string;
  nota?: number;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Faq {
  id: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface GaleriaItem {
  id: string;
  titulo?: string;
  descricao?: string;
  url: string;
  tipo: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

// ── Leads ────────────────────────────────────────────────

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  mensagem?: string;
  origem?: string;
  ip_origem?: string;
  respondido: boolean;
  respondido_em?: string;
  lgpd_aceito: boolean;
  lgpd_aceito_em?: string;
  created_at: string;
}

// ── Contatos ─────────────────────────────────────────────

export interface Contato {
  id: string;
  telefone?: string;
  telefone_2?: string;
  email?: string;
  whatsapp?: string;
  whatsapp_hover?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  mapa_embed?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

// ── Arquivos ─────────────────────────────────────────────

export interface Arquivo {
  id: string;
  nome_original?: string;
  nome_arquivo: string;
  url: string;
  tipo?: string;
  mime_type?: string;
  tamanho_bytes?: number;
  largura?: number;
  altura?: number;
  created_at: string;
}

// ── Temas ────────────────────────────────────────────────

export interface Tema {
  id: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_destaque: string;
  cor_texto: string;
  cor_fundo: string;
  cor_header: string;
  cor_footer: string;
  fonte_principal: string;
  fonte_titulo: string;
  ativo: boolean;
}

// ── Dashboard ────────────────────────────────────────────

export interface DashboardData {
  leads: {
    total: number;
    ativos: number;
    respondidos: number;
    ultimos_30_dias: number;
    por_mes: { mes: string; total: number }[];
  };
  posts: {
    total: number;
    publicados: number;
    rascunhos: number;
  };
  itens: {
    total: number;
    ativos: number;
  };
  arquivos: {
    total: number;
    tamanho_total_bytes: number;
  };
}

// ── Configuracoes ───────────────────────────────────────

export interface ConfiguracaoChave {
  chave: string;
  valor: string;
  tipo: string;
}

export interface ConfiguracaoSecao {
  secao: string;
  valores: Record<string, string>;
}

// ── Modulos ─────────────────────────────────────────────

export interface Modulo {
  modulo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

// ── Grafico de Leads ────────────────────────────────────

export interface LeadGrafico {
  mes: string;
  total: number;
}

// ── Utilitarios ──────────────────────────────────────────

export interface ListParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: string;
  tipo?: string;
  [key: string]: any;
}

export interface ReordenarItem {
  id: string;
  ordem: number;
}

// ── Create / Update types ───────────────────────────────

export type BannerCreate = Omit<Banner, 'id' | 'created_at'>;
export type BannerUpdate = Partial<BannerCreate>;

export type DestaqueCreate = Omit<Destaque, 'id' | 'created_at'>;
export type DestaqueUpdate = Partial<DestaqueCreate>;

export type EquipeCreate = Omit<Equipe, 'id' | 'created_at'>;
export type EquipeUpdate = Partial<EquipeCreate>;

export type DepoimentoCreate = Omit<Depoimento, 'id' | 'created_at'>;
export type DepoimentoUpdate = Partial<DepoimentoCreate>;

export type FaqCreate = Omit<Faq, 'id' | 'created_at'>;
export type FaqUpdate = Partial<FaqCreate>;

export type GaleriaCreate = Omit<GaleriaItem, 'id' | 'created_at'>;
export type GaleriaUpdate = Partial<GaleriaCreate>;

// Alias for galeriaService compatibility
export type Galeria = GaleriaItem;

export type ContatoUpdate = Partial<Omit<Contato, 'id'>>;

export type TemaUpdate = Partial<Omit<Tema, 'id'>>;

export interface UsuarioCreate {
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'usuario';
  ativo?: boolean;
  permissoes?: Permissao[];
}

export type UsuarioUpdate = Partial<Omit<UsuarioCreate, 'senha'>> & {
  senha?: string;
  permissoes?: Permissao[];
};

export interface EmpresaCreate {
  nome: string;
  slug: string;
  dominio?: string;
  plano: string;
  admin_nome: string;
  admin_email: string;
  admin_senha: string;
}

export type EmpresaUpdate = Partial<Omit<EmpresaCreate, 'admin_nome' | 'admin_email' | 'admin_senha'>> & {
  r2_bucket_name?: string;
  r2_public_url?: string;
  r2_access_key_id?: string;
  r2_secret_access_key?: string;
  webhook_leads?: string;
  ativo?: boolean;
};
