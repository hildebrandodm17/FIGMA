from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class LeadCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    telefone: str | None = Field(None, max_length=30)
    mensagem: str | None = None
    origem: str | None = Field(None, max_length=500)
    lgpd_aceito: bool

    @field_validator("lgpd_aceito")
    @classmethod
    def lgpd_deve_ser_aceito(cls, v: bool) -> bool:
        if not v:
            raise ValueError("É necessário aceitar a política de privacidade")
        return v


class LeadUpdate(BaseModel):
    respondido: bool | None = None


class LeadResponse(BaseModel):
    id: str
    nome: str
    email: str
    telefone: str | None = None
    mensagem: str | None = None
    origem: str | None = None
    ip_origem: str | None = None
    respondido: bool
    respondido_em: datetime | None = None
    lgpd_aceito: bool
    lgpd_aceito_em: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadGraficoItem(BaseModel):
    mes: str
    total: int


class LeadPublicResponse(BaseModel):
    id: str
    mensagem: str = "Mensagem enviada com sucesso. Entraremos em contato em breve."
