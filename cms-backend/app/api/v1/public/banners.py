from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.apresentacao import Banner
from app.models.empresa import Empresa

router = APIRouter(tags=["Site - Banners"])


@router.get("/banners")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_banners(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("banners", empresa.id, db)

    result = await db.execute(
        select(Banner)
        .where(
            Banner.empresa_id == empresa.id,
            Banner.ativo == True,
            Banner.deletado_em.is_(None),
        )
        .order_by(Banner.ordem)
    )
    banners = result.scalars().all()

    return {
        "data": [
            {
                "id": str(b.id),
                "titulo": b.titulo,
                "subtitulo": b.subtitulo,
                "texto": b.texto,
                "label_cta": b.label_cta,
                "link_cta": b.link_cta,
                "imagem_url": b.imagem_url,
                "imagem_mobile": b.imagem_mobile,
                "ordem": b.ordem,
            }
            for b in banners
        ]
    }
