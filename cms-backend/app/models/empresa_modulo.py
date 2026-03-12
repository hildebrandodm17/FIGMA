import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class EmpresaModulo(Base):
    __tablename__ = "empresa_modulos"
    __table_args__ = (
        UniqueConstraint("empresa_id", "modulo", name="uq_empresa_modulo"),
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
    modulo: Mapped[str] = mapped_column(String(50), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    empresa = relationship("Empresa", back_populates="modulos")


MODULOS_PADRAO = [
    "banners",
    "posts",
    "categorias",
    "itens",
    "destaques",
    "equipe",
    "depoimentos",
    "faq",
    "galeria",
    "leads",
    "contatos",
    "arquivos",
    "configuracoes",
    "temas",
]
