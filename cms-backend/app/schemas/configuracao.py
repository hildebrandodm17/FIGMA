from pydantic import BaseModel, Field


class ConfiguracaoItem(BaseModel):
    chave: str
    valor: str | None = None
    tipo: str = "texto"


class ConfiguracaoSecaoResponse(BaseModel):
    secao: str
    valores: dict[str, str | None]


class ConfiguracaoUpdateRequest(BaseModel):
    valores: dict[str, str | None]


class ConfiguracaoNovaChaveRequest(BaseModel):
    chave: str = Field(..., min_length=1, max_length=100)
    valor: str | None = None
    tipo: str = Field("texto", pattern=r"^(texto|rich_text|imagem|url|numero|json)$")


class TemaResponse(BaseModel):
    id: str
    cor_primaria: str
    cor_secundaria: str
    cor_destaque: str
    cor_texto: str
    cor_fundo: str
    cor_header: str
    cor_footer: str
    fonte_principal: str
    fonte_titulo: str
    ativo: bool

    model_config = {"from_attributes": True}


class TemaUpdate(BaseModel):
    cor_primaria: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_secundaria: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_destaque: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_texto: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_fundo: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_header: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    cor_footer: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")
    fonte_principal: str | None = Field(None, max_length=100)
    fonte_titulo: str | None = Field(None, max_length=100)
