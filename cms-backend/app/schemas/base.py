from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    pagina: int
    limite: int
    paginas: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta


class SingleResponse(BaseModel, Generic[T]):
    data: T


class ErrorDetail(BaseModel):
    codigo: str
    mensagem: str
    detalhes: Any | None = None


class ErrorResponse(BaseModel):
    erro: ErrorDetail


class PaginationParams(BaseModel):
    pagina: int = Field(1, ge=1)
    limite: int = Field(20, ge=1, le=100)
    ordem: str | None = None
    direcao: str = Field("desc", pattern=r"^(asc|desc)$")
    busca: str | None = None
    ativo: bool | None = None


class ReordenarItem(BaseModel):
    id: str
    ordem: int


class ReordenarRequest(BaseModel):
    ordem: list[ReordenarItem]
