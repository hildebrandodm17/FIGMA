from pydantic import BaseModel, Field


class ContatoUpdate(BaseModel):
    telefone: str | None = Field(None, max_length=30)
    telefone_2: str | None = Field(None, max_length=30)
    email: str | None = Field(None, max_length=200)
    whatsapp: str | None = Field(None, max_length=30)
    whatsapp_hover: str | None = Field(None, max_length=200)
    endereco: str | None = None
    cidade: str | None = Field(None, max_length=200)
    estado: str | None = Field(None, max_length=2)
    cep: str | None = Field(None, max_length=9)
    mapa_embed: str | None = None
    facebook: str | None = Field(None, max_length=500)
    instagram: str | None = Field(None, max_length=500)
    linkedin: str | None = Field(None, max_length=500)
    youtube: str | None = Field(None, max_length=500)
    tiktok: str | None = Field(None, max_length=500)


class ContatoResponse(BaseModel):
    id: str
    telefone: str | None = None
    telefone_2: str | None = None
    email: str | None = None
    whatsapp: str | None = None
    whatsapp_hover: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = None
    cep: str | None = None
    mapa_embed: str | None = None
    facebook: str | None = None
    instagram: str | None = None
    linkedin: str | None = None
    youtube: str | None = None
    tiktok: str | None = None

    model_config = {"from_attributes": True}
