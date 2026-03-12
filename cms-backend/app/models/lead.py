import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Lead(BaseModel):
    __tablename__ = "leads"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Dados do contato
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    mensagem: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Rastreamento
    origem: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_origem: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # CRM
    respondido: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    respondido_em: Mapped[datetime | None] = mapped_column(nullable=True)
    respondido_por: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id"),
        nullable=True,
    )

    # LGPD
    lgpd_aceito: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    lgpd_aceito_em: Mapped[datetime | None] = mapped_column(nullable=True)
    lgpd_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
