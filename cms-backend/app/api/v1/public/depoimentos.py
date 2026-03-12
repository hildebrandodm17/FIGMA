from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Depoimento
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - Depoimentos"])


@router.get("/depoimentos")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_depoimentos(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("depoimentos", empresa.id, db)

    result = await db.execute(
        select(Depoimento)
        .where(Depoimento.empresa_id == empresa.id, Depoimento.ativo == True, Depoimento.deletado_em.is_(None))
        .order_by(Depoimento.ordem)
    )

    return {
        "data": [
            {"id": str(d.id), "nome": d.nome, "cargo": d.cargo, "empresa": d.empresa,
             "texto": d.texto, "foto_url": d.foto_url, "nota": d.nota, "ordem": d.ordem}
            for d in result.scalars().all()
        ]
    }
