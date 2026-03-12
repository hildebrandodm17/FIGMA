import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Categoria(BaseModel):
    __tablename__ = "categorias"
    __table_args__ = (
        UniqueConstraint("empresa_id", "slug", "tipo", name="uq_categorias_empresa_slug_tipo"),
    )

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # 'post' | 'item'
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    posts = relationship("Post", back_populates="categoria", lazy="noload")


class Post(BaseModel):
    __tablename__ = "posts"
    __table_args__ = (
        UniqueConstraint("empresa_id", "slug", name="uq_posts_empresa_slug"),
    )

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(String(30), nullable=False, default="post")
    titulo: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False)
    resumo: Mapped[str | None] = mapped_column(Text, nullable=True)
    conteudo: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    imagem_capa: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    categoria_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categorias.id"),
        nullable=True,
    )
    autor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    publicado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    publicado_em: Mapped[datetime | None] = mapped_column(nullable=True)

    # SEO
    meta_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    meta_desc: Mapped[str | None] = mapped_column(String(160), nullable=True)
    og_image: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    og_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    indexavel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Controle
    versao: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relationships
    categoria = relationship("Categoria", back_populates="posts", lazy="selectin")
