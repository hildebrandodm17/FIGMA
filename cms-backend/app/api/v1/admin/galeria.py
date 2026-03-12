from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Galeria
from app.models.usuario import Usuario
from app.schemas.apresentacao import GaleriaCreate, GaleriaResponse, GaleriaUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Galeria"])


@router.get("/galeria")
async def listar(
    current_user: Usuario = Depends(check_permissao("galeria", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("galeria", current_user.empresa_id, db)

    query = select(Galeria).where(
        Galeria.empresa_id == current_user.empresa_id,
        Galeria.deletado_em.is_(None),
    ).order_by(Galeria.ordem)

    if ativo is not None:
        query = query.where(Galeria.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [GaleriaResponse.model_validate(g).model_dump() for g in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/galeria", status_code=201)
async def criar(
    data: GaleriaCreate,
    current_user: Usuario = Depends(check_permissao("galeria", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("galeria", current_user.empresa_id, db)

    item = Galeria(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(item)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "galeria", item.id)
    await db.commit()
    await db.refresh(item)
    return {"data": GaleriaResponse.model_validate(item).model_dump()}


@router.get("/galeria/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("galeria", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Galeria).where(
            Galeria.id == id, Galeria.empresa_id == current_user.empresa_id, Galeria.deletado_em.is_(None)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item da galeria não encontrado"})
    return {"data": GaleriaResponse.model_validate(item).model_dump()}


@router.put("/galeria/{id}")
async def atualizar(
    id: UUID,
    data: GaleriaUpdate,
    current_user: Usuario = Depends(check_permissao("galeria", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Galeria).where(
            Galeria.id == id, Galeria.empresa_id == current_user.empresa_id, Galeria.deletado_em.is_(None)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item da galeria não encontrado"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(item, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "galeria", id)
    await db.commit()
    await db.refresh(item)
    return {"data": GaleriaResponse.model_validate(item).model_dump()}


@router.delete("/galeria/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("galeria", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Galeria).where(
            Galeria.id == id, Galeria.empresa_id == current_user.empresa_id, Galeria.deletado_em.is_(None)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item da galeria não encontrado"})

    item.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "galeria", id)
    await db.commit()


@router.patch("/galeria/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("galeria", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Galeria)
            .where(Galeria.id == UUID(item.id), Galeria.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
