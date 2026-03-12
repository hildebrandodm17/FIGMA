import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Item(BaseModel):
    __tablename__ = "itens"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Produto")
    nome: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False)
    resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    descricao: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    imagem_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    imagens: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # ["url1", "url2", ...]
    categoria_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categorias.id"),
        nullable=True,
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    versao: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    categoria = relationship("Categoria", lazy="selectin")
