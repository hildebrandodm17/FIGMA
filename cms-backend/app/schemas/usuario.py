from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PermissaoSchema(BaseModel):
    pode_ver: bool = False
    pode_criar: bool = False
    pode_editar: bool = False
    pode_deletar: bool = False
    pode_exportar: bool = False


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    role: str = Field("usuario", pattern=r"^(admin|usuario)$")
    permissoes: dict[str, PermissaoSchema] | None = None


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=200)
    email: EmailStr | None = None
    senha: str | None = Field(None, min_length=6)
    ativo: bool | None = None
    role: str | None = Field(None, pattern=r"^(admin|usuario)$")
    permissoes: dict[str, PermissaoSchema] | None = None


class PermissaoResponse(BaseModel):
    modulo: str
    pode_ver: bool
    pode_criar: bool
    pode_editar: bool
    pode_deletar: bool
    pode_exportar: bool

    model_config = {"from_attributes": True}


class UsuarioResponse(BaseModel):
    id: str
    nome: str
    email: str
    role: str
    ativo: bool
    ultimo_acesso: datetime | None = None
    permissoes: list[PermissaoResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
