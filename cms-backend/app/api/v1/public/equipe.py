from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Equipe
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - Equipe"])


@router.get("/equipe")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_equipe(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("equipe", empresa.id, db)

    result = await db.execute(
        select(Equipe)
        .where(Equipe.empresa_id == empresa.id, Equipe.ativo == True, Equipe.deletado_em.is_(None))
        .order_by(Equipe.ordem)
    )

    return {
        "data": [
            {"id": str(e.id), "nome": e.nome, "cargo": e.cargo, "bio": e.bio,
             "foto_url": e.foto_url, "linkedin": e.linkedin, "email": e.email, "ordem": e.ordem}
            for e in result.scalars().all()
        ]
    }
