from fastapi import APIRouter

from app.api.v1.admin import (
    arquivos,
    banners,
    categorias,
    configuracoes,
    contatos,
    dashboard,
    depoimentos,
    destaques,
    equipe,
    faq,
    galeria,
    itens,
    leads,
    modulos,
    posts,
    temas,
    usuarios,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

router.include_router(dashboard.router)
router.include_router(banners.router)
router.include_router(posts.router)
router.include_router(categorias.router)
router.include_router(itens.router)
router.include_router(destaques.router)
router.include_router(equipe.router)
router.include_router(depoimentos.router)
router.include_router(faq.router)
router.include_router(galeria.router)
router.include_router(leads.router)
router.include_router(contatos.router)
router.include_router(arquivos.router)
router.include_router(configuracoes.router)
router.include_router(temas.router)
router.include_router(usuarios.router)
router.include_router(modulos.router)
