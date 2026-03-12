from fastapi import APIRouter

from app.api.v1.public import (
    banners,
    config,
    conteudo,
    depoimentos,
    destaques,
    equipe,
    faq,
    galeria,
    itens,
    leads,
)

router = APIRouter(prefix="/site", tags=["Site Público"])

router.include_router(config.router)
router.include_router(conteudo.router)
router.include_router(itens.router)
router.include_router(banners.router)
router.include_router(destaques.router)
router.include_router(equipe.router)
router.include_router(depoimentos.router)
router.include_router(faq.router)
router.include_router(galeria.router)
router.include_router(leads.router)
