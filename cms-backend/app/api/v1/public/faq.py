from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Faq
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - FAQ"])


@router.get("/faq")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_faq(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("faq", empresa.id, db)

    result = await db.execute(
        select(Faq)
        .where(Faq.empresa_id == empresa.id, Faq.ativo == True, Faq.deletado_em.is_(None))
        .order_by(Faq.ordem)
    )

    return {
        "data": [
            {"id": str(f.id), "pergunta": f.pergunta, "resposta": f.resposta, "ordem": f.ordem}
            for f in result.scalars().all()
        ]
    }
