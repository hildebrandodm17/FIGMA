from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Destaque
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - Destaques"])


@router.get("/destaques")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_destaques(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("destaques", empresa.id, db)

    result = await db.execute(
        select(Destaque)
        .where(
            Destaque.empresa_id == empresa.id,
            Destaque.ativo == True,
            Destaque.deletado_em.is_(None),
        )
        .order_by(Destaque.ordem)
    )

    return {
        "data": [
            {
                "id": str(d.id),
                "titulo": d.titulo,
                "descricao": d.descricao,
                "icone_url": d.icone_url,
                "icone_svg": d.icone_svg,
                "ordem": d.ordem,
            }
            for d in result.scalars().all()
        ]
    }
