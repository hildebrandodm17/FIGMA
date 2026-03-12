from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.conteudo import CategoriaResponse


class ItemCreate(BaseModel):
    tipo_label: str = Field("Produto", max_length=100)
    nome: str = Field(..., min_length=2, max_length=500)
    slug: str | None = Field(None, max_length=500, pattern=r"^[a-z0-9-]+$")
    resumo: str | None = None
    descricao: Any | None = None  # TipTap JSON
    imagem_url: str | None = Field(None, max_length=1000)
    imagens: list[str] | None = None
    categoria_id: str | None = None
    ordem: int = 0
    ativo: bool = True


class ItemUpdate(BaseModel):
    tipo_label: str | None = Field(None, max_length=100)
    nome: str | None = Field(None, min_length=2, max_length=500)
    slug: str | None = Field(None, max_length=500, pattern=r"^[a-z0-9-]+$")
    resumo: str | None = None
    descricao: Any | None = None
    imagem_url: str | None = Field(None, max_length=1000)
    imagens: list[str] | None = None
    categoria_id: str | None = None
    ordem: int | None = None
    ativo: bool | None = None
    versao: int = Field(..., ge=1)


class ItemResponse(BaseModel):
    id: str
    tipo_label: str
    nome: str
    slug: str
    resumo: str | None = None
    descricao: Any | None = None
    imagem_url: str | None = None
    imagens: list[str] | None = None
    categoria: CategoriaResponse | None = None
    ordem: int
    ativo: bool
    versao: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItemListResponse(BaseModel):
    id: str
    tipo_label: str
    nome: str
    slug: str
    resumo: str | None = None
    imagem_url: str | None = None
    categoria: CategoriaResponse | None = None
    ordem: int
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
