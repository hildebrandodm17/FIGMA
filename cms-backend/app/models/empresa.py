from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Empresa(BaseModel):
    __tablename__ = "empresas"

    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    dominio: Mapped[str | None] = mapped_column(String(200), nullable=True)
    plano: Mapped[str] = mapped_column(String(50), nullable=False, default="basico")
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Credenciais R2 (criptografadas com Fernet)
    r2_bucket_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    r2_access_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    r2_secret_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    r2_public_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Webhooks
    webhook_leads: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    webhook_secret: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    usuarios = relationship("Usuario", back_populates="empresa", lazy="selectin")
    modulos = relationship("EmpresaModulo", back_populates="empresa", lazy="selectin")
