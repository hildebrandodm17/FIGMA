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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class Usuario(BaseModel):
    __tablename__ = "usuarios"

    empresa_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=True,  # NULL = superadmin
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    senha_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # superadmin | admin | usuario
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ultimo_acesso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    empresa = relationship("Empresa", back_populates="usuarios", lazy="selectin")
    permissoes = relationship(
        "UsuarioPermissao", back_populates="usuario", lazy="selectin", cascade="all, delete-orphan"
    )


class UsuarioPermissao(Base):
    __tablename__ = "usuario_permissoes"
    __table_args__ = (
        UniqueConstraint("usuario_id", "modulo", name="uq_usuario_modulo"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    modulo: Mapped[str] = mapped_column(String(50), nullable=False)
    pode_ver: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pode_criar: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pode_editar: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pode_deletar: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pode_exportar: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    usuario = relationship("Usuario", back_populates="permissoes")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revogado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
