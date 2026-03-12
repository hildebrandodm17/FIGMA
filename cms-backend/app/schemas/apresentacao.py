from datetime import datetime

from pydantic import BaseModel, Field


# --- Banners ---

class BannerCreate(BaseModel):
    titulo: str | None = Field(None, max_length=500)
    subtitulo: str | None = Field(None, max_length=500)
    texto: str | None = None
    label_cta: str | None = Field(None, max_length=100)
    link_cta: str | None = Field(None, max_length=1000)
    imagem_url: str | None = Field(None, max_length=1000)
    imagem_mobile: str | None = Field(None, max_length=1000)
    ordem: int = 0
    ativo: bool = True


class BannerUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=500)
    subtitulo: str | None = Field(None, max_length=500)
    texto: str | None = None
    label_cta: str | None = Field(None, max_length=100)
    link_cta: str | None = Field(None, max_length=1000)
    imagem_url: str | None = Field(None, max_length=1000)
    imagem_mobile: str | None = Field(None, max_length=1000)
    ordem: int | None = None
    ativo: bool | None = None


class BannerResponse(BaseModel):
    id: str
    titulo: str | None = None
    subtitulo: str | None = None
    texto: str | None = None
    label_cta: str | None = None
    link_cta: str | None = None
    imagem_url: str | None = None
    imagem_mobile: str | None = None
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Destaques ---

class DestaqueCreate(BaseModel):
    titulo: str = Field(..., min_length=2, max_length=200)
    descricao: str | None = None
    icone_url: str | None = Field(None, max_length=1000)
    icone_svg: str | None = None
    ordem: int = 0
    ativo: bool = True


class DestaqueUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=2, max_length=200)
    descricao: str | None = None
    icone_url: str | None = Field(None, max_length=1000)
    icone_svg: str | None = None
    ordem: int | None = None
    ativo: bool | None = None


class DestaqueResponse(BaseModel):
    id: str
    titulo: str
    descricao: str | None = None
    icone_url: str | None = None
    icone_svg: str | None = None
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Equipe ---

class EquipeCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    cargo: str | None = Field(None, max_length=200)
    bio: str | None = None
    foto_url: str | None = Field(None, max_length=1000)
    linkedin: str | None = Field(None, max_length=500)
    email: str | None = Field(None, max_length=200)
    ordem: int = 0
    ativo: bool = True


class EquipeUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=200)
    cargo: str | None = Field(None, max_length=200)
    bio: str | None = None
    foto_url: str | None = Field(None, max_length=1000)
    linkedin: str | None = Field(None, max_length=500)
    email: str | None = Field(None, max_length=200)
    ordem: int | None = None
    ativo: bool | None = None


class EquipeResponse(BaseModel):
    id: str
    nome: str
    cargo: str | None = None
    bio: str | None = None
    foto_url: str | None = None
    linkedin: str | None = None
    email: str | None = None
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Depoimentos ---

class DepoimentoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    cargo: str | None = Field(None, max_length=200)
    empresa: str | None = Field(None, max_length=200)
    texto: str = Field(..., min_length=5)
    foto_url: str | None = Field(None, max_length=1000)
    nota: int | None = Field(None, ge=1, le=5)
    ordem: int = 0
    ativo: bool = True


class DepoimentoUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=200)
    cargo: str | None = Field(None, max_length=200)
    empresa: str | None = Field(None, max_length=200)
    texto: str | None = Field(None, min_length=5)
    foto_url: str | None = Field(None, max_length=1000)
    nota: int | None = Field(None, ge=1, le=5)
    ordem: int | None = None
    ativo: bool | None = None


class DepoimentoResponse(BaseModel):
    id: str
    nome: str
    cargo: str | None = None
    empresa: str | None = None
    texto: str
    foto_url: str | None = None
    nota: int | None = None
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- FAQ ---

class FaqCreate(BaseModel):
    pergunta: str = Field(..., min_length=5, max_length=500)
    resposta: str = Field(..., min_length=5)
    ordem: int = 0
    ativo: bool = True


class FaqUpdate(BaseModel):
    pergunta: str | None = Field(None, min_length=5, max_length=500)
    resposta: str | None = Field(None, min_length=5)
    ordem: int | None = None
    ativo: bool | None = None


class FaqResponse(BaseModel):
    id: str
    pergunta: str
    resposta: str
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Galeria ---

class GaleriaCreate(BaseModel):
    titulo: str | None = Field(None, max_length=300)
    descricao: str | None = None
    url: str = Field(..., max_length=1000)
    tipo: str = Field("foto", pattern=r"^(foto|video)$")
    ordem: int = 0
    ativo: bool = True


class GaleriaUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=300)
    descricao: str | None = None
    url: str | None = Field(None, max_length=1000)
    tipo: str | None = Field(None, pattern=r"^(foto|video)$")
    ordem: int | None = None
    ativo: bool | None = None


class GaleriaResponse(BaseModel):
    id: str
    titulo: str | None = None
    descricao: str | None = None
    url: str
    tipo: str
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
