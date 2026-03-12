from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.conteudo import Categoria
from app.models.empresa import Empresa
from app.models.item import Item
from app.utils.pagination import paginar

router = APIRouter(tags=["Site - Itens"])


@router.get("/itens")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_itens(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
    categoria_slug: str | None = None,
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
):
    await verificar_modulo_ativo("itens", empresa.id, db)

    query = (
        select(Item)
        .options(selectinload(Item.categoria))
        .where(
            Item.empresa_id == empresa.id,
            Item.ativo == True,
            Item.deletado_em.is_(None),
        )
        .order_by(Item.ordem)
    )

    if categoria_slug:
        query = query.join(Categoria).where(Categoria.slug == categoria_slug)

    items, meta = await paginar(db, query, pagina, limite)

    data = []
    for item in items:
        data.append({
            "id": str(item.id),
            "tipo_label": item.tipo_label,
            "nome": item.nome,
            "slug": item.slug,
            "resumo": item.resumo,
            "imagem_url": item.imagem_url,
            "categoria": {
                "id": str(item.categoria.id),
                "nome": item.categoria.nome,
                "slug": item.categoria.slug,
            } if item.categoria else None,
            "ordem": item.ordem,
        })

    return {"data": data, "meta": meta.model_dump()}


@router.get("/itens/{slug}")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def obter_item(
    request: Request,
    slug: str,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("itens", empresa.id, db)

    result = await db.execute(
        select(Item)
        .options(selectinload(Item.categoria))
        .where(
            Item.empresa_id == empresa.id,
            Item.slug == slug,
            Item.ativo == True,
            Item.deletado_em.is_(None),
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item não encontrado"})

    return {
        "data": {
            "id": str(item.id),
            "tipo_label": item.tipo_label,
            "nome": item.nome,
            "slug": item.slug,
            "resumo": item.resumo,
            "descricao": item.descricao,
            "imagem_url": item.imagem_url,
            "imagens": item.imagens,
            "categoria": {
                "id": str(item.categoria.id),
                "nome": item.categoria.nome,
                "slug": item.categoria.slug,
            } if item.categoria else None,
            "ordem": item.ordem,
        }
    }
