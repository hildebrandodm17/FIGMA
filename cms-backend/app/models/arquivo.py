import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Arquivo(Base):
    __tablename__ = "arquivos"

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
    nome_original: Mapped[str | None] = mapped_column(String(500), nullable=True)
    nome_arquivo: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)  # image | document | video
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tamanho_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    largura: Mapped[int | None] = mapped_column(Integer, nullable=True)
    altura: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    deletado_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
