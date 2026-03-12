import math

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.base import PaginationMeta


async def paginar(
    db: AsyncSession,
    query: Select,
    pagina: int = 1,
    limite: int = 20,
) -> tuple[list, PaginationMeta]:
    """Aplica paginação a uma query e retorna (resultados, meta)."""
    # Contar total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Aplicar offset/limit
    offset = (pagina - 1) * limite
    paginated_query = query.offset(offset).limit(limite)
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())

    meta = PaginationMeta(
        total=total,
        pagina=pagina,
        limite=limite,
        paginas=math.ceil(total / limite) if total > 0 else 0,
    )

    return items, meta
