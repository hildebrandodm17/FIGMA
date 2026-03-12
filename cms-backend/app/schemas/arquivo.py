from datetime import datetime

from pydantic import BaseModel


class ArquivoResponse(BaseModel):
    id: str
    nome_original: str | None = None
    nome_arquivo: str
    url: str
    tipo: str | None = None
    mime_type: str | None = None
    tamanho_bytes: int | None = None
    largura: int | None = None
    altura: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArquivoUploadResponse(BaseModel):
    id: str
    url: str
    tipo: str | None = None
    tamanho_bytes: int | None = None
    largura: int | None = None
    altura: int | None = None
