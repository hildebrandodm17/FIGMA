import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Configuracao(Base):
    __tablename__ = "configuracoes"
    __table_args__ = (
        UniqueConstraint("empresa_id", "secao", "chave", name="uq_config_empresa_secao_chave"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    secao: Mapped[str] = mapped_column(String(100), nullable=False)
    chave: Mapped[str] = mapped_column(String(100), nullable=False)
    valor: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="texto")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Tema(Base):
    __tablename__ = "temas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    tema_slug: Mapped[str] = mapped_column(String(50), nullable=False, default="padrao")
    cor_primaria: Mapped[str] = mapped_column(String(7), nullable=False, default="#3B82F6")
    cor_secundaria: Mapped[str] = mapped_column(String(7), nullable=False, default="#1E40AF")
    cor_destaque: Mapped[str] = mapped_column(String(7), nullable=False, default="#F59E0B")
    cor_texto: Mapped[str] = mapped_column(String(7), nullable=False, default="#111827")
    cor_fundo: Mapped[str] = mapped_column(String(7), nullable=False, default="#FFFFFF")
    cor_header: Mapped[str] = mapped_column(String(7), nullable=False, default="#FFFFFF")
    cor_footer: Mapped[str] = mapped_column(String(7), nullable=False, default="#111827")
    fonte_principal: Mapped[str] = mapped_column(String(100), nullable=False, default="Inter")
    fonte_titulo: Mapped[str] = mapped_column(String(100), nullable=False, default="Inter")
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
