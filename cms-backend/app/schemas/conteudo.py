from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Categorias ---

class CategoriaCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    slug: str | None = Field(None, max_length=200, pattern=r"^[a-z0-9-]+$")
    tipo: str = Field(..., pattern=r"^(post|item)$")
    ativo: bool = True


class CategoriaUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=200)
    slug: str | None = Field(None, max_length=200, pattern=r"^[a-z0-9-]+$")
    ativo: bool | None = None


class CategoriaResponse(BaseModel):
    id: str
    nome: str
    slug: str
    tipo: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Posts ---

class PostCreate(BaseModel):
    tipo: str = Field("post", max_length=30)
    titulo: str = Field(..., min_length=3, max_length=500)
    slug: str | None = Field(None, max_length=500, pattern=r"^[a-z0-9-]+$")
    resumo: str | None = None
    conteudo: Any | None = None  # TipTap JSON
    imagem_capa: str | None = Field(None, max_length=1000)
    categoria_id: str | None = None
    autor: str | None = Field(None, max_length=200)
    publicado: bool = False
    publicado_em: datetime | None = None
    # SEO
    meta_title: str | None = Field(None, max_length=70)
    meta_desc: str | None = Field(None, max_length=160)
    og_image: str | None = Field(None, max_length=1000)
    og_title: str | None = Field(None, max_length=200)
    canonical_url: str | None = Field(None, max_length=1000)
    indexavel: bool = True


class PostUpdate(BaseModel):
    tipo: str | None = Field(None, max_length=30)
    titulo: str | None = Field(None, min_length=3, max_length=500)
    slug: str | None = Field(None, max_length=500, pattern=r"^[a-z0-9-]+$")
    resumo: str | None = None
    conteudo: Any | None = None
    imagem_capa: str | None = Field(None, max_length=1000)
    categoria_id: str | None = None
    autor: str | None = Field(None, max_length=200)
    publicado: bool | None = None
    publicado_em: datetime | None = None
    meta_title: str | None = Field(None, max_length=70)
    meta_desc: str | None = Field(None, max_length=160)
    og_image: str | None = Field(None, max_length=1000)
    og_title: str | None = Field(None, max_length=200)
    canonical_url: str | None = Field(None, max_length=1000)
    indexavel: bool | None = None
    versao: int = Field(..., ge=1)


class SeoResponse(BaseModel):
    meta_title: str | None = None
    meta_desc: str | None = None
    og_image: str | None = None
    og_title: str | None = None
    canonical_url: str | None = None
    indexavel: bool = True


class PostResponse(BaseModel):
    id: str
    tipo: str
    titulo: str
    slug: str
    resumo: str | None = None
    conteudo: Any | None = None
    imagem_capa: str | None = None
    categoria: CategoriaResponse | None = None
    autor: str | None = None
    publicado: bool
    publicado_em: datetime | None = None
    versao: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    id: str
    tipo: str
    titulo: str
    slug: str
    resumo: str | None = None
    imagem_capa: str | None = None
    categoria: CategoriaResponse | None = None
    autor: str | None = None
    publicado: bool
    publicado_em: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PostPublicResponse(BaseModel):
    id: str
    tipo: str
    titulo: str
    slug: str
    resumo: str | None = None
    conteudo: Any | None = None
    imagem_capa: str | None = None
    autor: str | None = None
    publicado_em: datetime | None = None
    categoria: CategoriaResponse | None = None
    seo: SeoResponse | None = None

    model_config = {"from_attributes": True}
