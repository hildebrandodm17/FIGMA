from datetime import datetime

from pydantic import BaseModel, Field


class EmpresaCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    dominio: str | None = Field(None, max_length=200)
    plano: str = Field("basico", max_length=50)
    # Dados do admin inicial
    admin_nome: str = Field(..., min_length=2, max_length=200)
    admin_email: str = Field(..., max_length=200)
    admin_senha: str = Field(..., min_length=6)


class EmpresaUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=200)
    dominio: str | None = Field(None, max_length=200)
    plano: str | None = Field(None, max_length=50)
    r2_bucket_name: str | None = None
    r2_access_key: str | None = None
    r2_secret_key: str | None = None
    r2_public_url: str | None = None
    webhook_leads: str | None = None
    webhook_secret: str | None = None


class EmpresaResponse(BaseModel):
    id: str
    nome: str
    slug: str
    dominio: str | None = None
    plano: str
    ativo: bool
    r2_bucket_name: str | None = None
    r2_public_url: str | None = None
    webhook_leads: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmpresaListResponse(BaseModel):
    id: str
    nome: str
    slug: str
    dominio: str | None = None
    plano: str
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
