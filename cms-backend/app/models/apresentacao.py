import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Banner(BaseModel):
    __tablename__ = "banners"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    titulo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subtitulo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    label_cta: Mapped[str | None] = mapped_column(String(100), nullable=True)
    link_cta: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    imagem_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    imagem_mobile: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Destaque(BaseModel):
    __tablename__ = "destaques"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    icone_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    icone_svg: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Equipe(BaseModel):
    __tablename__ = "equipe"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cargo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    linkedin: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Depoimento(BaseModel):
    __tablename__ = "depoimentos"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cargo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(200), nullable=True)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    foto_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    nota: Mapped[int | None] = mapped_column(
        Integer,
        CheckConstraint("nota BETWEEN 1 AND 5", name="ck_depoimentos_nota"),
        nullable=True,
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Faq(BaseModel):
    __tablename__ = "faq"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    pergunta: Mapped[str] = mapped_column(String(500), nullable=False)
    resposta: Mapped[str] = mapped_column(Text, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Galeria(BaseModel):
    __tablename__ = "galeria"

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("empresas.id", ondelete="CASCADE"),
        nullable=False,
    )
    titulo: Mapped[str | None] = mapped_column(String(300), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    tipo: Mapped[str] = mapped_column(
        String(20),
        CheckConstraint("tipo IN ('foto', 'video')", name="ck_galeria_tipo"),
        nullable=False,
        default="foto",
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
