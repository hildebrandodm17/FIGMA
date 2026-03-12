from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Banner
from app.models.usuario import Usuario
from app.schemas.apresentacao import BannerCreate, BannerResponse, BannerUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Banners"])


@router.get("/banners")
async def listar(
    current_user: Usuario = Depends(check_permissao("banners", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("banners", current_user.empresa_id, db)

    query = select(Banner).where(
        Banner.empresa_id == current_user.empresa_id,
        Banner.deletado_em.is_(None),
    ).order_by(Banner.ordem)

    if ativo is not None:
        query = query.where(Banner.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [BannerResponse.model_validate(b).model_dump() for b in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/banners", status_code=201)
async def criar(
    data: BannerCreate,
    current_user: Usuario = Depends(check_permissao("banners", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("banners", current_user.empresa_id, db)

    banner = Banner(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(banner)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "banners", banner.id)
    await db.commit()
    await db.refresh(banner)
    return {"data": BannerResponse.model_validate(banner).model_dump()}


@router.get("/banners/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("banners", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Banner).where(
            Banner.id == id, Banner.empresa_id == current_user.empresa_id, Banner.deletado_em.is_(None)
        )
    )
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Banner não encontrado"})
    return {"data": BannerResponse.model_validate(banner).model_dump()}


@router.put("/banners/{id}")
async def atualizar(
    id: UUID,
    data: BannerUpdate,
    current_user: Usuario = Depends(check_permissao("banners", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Banner).where(
            Banner.id == id, Banner.empresa_id == current_user.empresa_id, Banner.deletado_em.is_(None)
        )
    )
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Banner não encontrado"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(banner, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "banners", id)
    await db.commit()
    await db.refresh(banner)
    return {"data": BannerResponse.model_validate(banner).model_dump()}


@router.delete("/banners/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("banners", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Banner).where(
            Banner.id == id, Banner.empresa_id == current_user.empresa_id, Banner.deletado_em.is_(None)
        )
    )
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Banner não encontrado"})

    banner.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "banners", id)
    await db.commit()


@router.patch("/banners/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("banners", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Banner)
            .where(Banner.id == UUID(item.id), Banner.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
