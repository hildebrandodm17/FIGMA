from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Galeria
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - Galeria"])


@router.get("/galeria")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_galeria(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("galeria", empresa.id, db)

    result = await db.execute(
        select(Galeria)
        .where(Galeria.empresa_id == empresa.id, Galeria.ativo == True, Galeria.deletado_em.is_(None))
        .order_by(Galeria.ordem)
    )

    return {
        "data": [
            {"id": str(g.id), "titulo": g.titulo, "descricao": g.descricao,
             "url": g.url, "tipo": g.tipo, "ordem": g.ordem}
            for g in result.scalars().all()
        ]
    }
