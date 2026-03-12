from uuid import UUID

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def gerar_slug(texto: str) -> str:
    """Gera slug a partir de texto."""
    return slugify(texto, max_length=200)


async def gerar_slug_unico(
    db: AsyncSession,
    model_class,
    texto: str,
    empresa_id: UUID,
    registro_id: UUID | None = None,
) -> str:
    """Gera um slug único por empresa, adicionando sufixo numérico se necessário."""
    base_slug = gerar_slug(texto)
    slug = base_slug
    contador = 1

    while True:
        query = select(model_class.id).where(
            model_class.empresa_id == empresa_id,
            model_class.slug == slug,
            model_class.deletado_em.is_(None),
        )
        if registro_id:
            query = query.where(model_class.id != registro_id)

        resultado = await db.execute(query)
        if not resultado.scalar_one_or_none():
            return slug

        slug = f"{base_slug}-{contador}"
        contador += 1
