from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Destaque
from app.models.usuario import Usuario
from app.schemas.apresentacao import DestaqueCreate, DestaqueResponse, DestaqueUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Destaques"])


@router.get("/destaques")
async def listar(
    current_user: Usuario = Depends(check_permissao("destaques", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("destaques", current_user.empresa_id, db)

    query = select(Destaque).where(
        Destaque.empresa_id == current_user.empresa_id,
        Destaque.deletado_em.is_(None),
    ).order_by(Destaque.ordem)

    if ativo is not None:
        query = query.where(Destaque.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [DestaqueResponse.model_validate(d).model_dump() for d in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/destaques", status_code=201)
async def criar(
    data: DestaqueCreate,
    current_user: Usuario = Depends(check_permissao("destaques", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("destaques", current_user.empresa_id, db)

    destaque = Destaque(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(destaque)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "destaques", destaque.id)
    await db.commit()
    await db.refresh(destaque)
    return {"data": DestaqueResponse.model_validate(destaque).model_dump()}


@router.get("/destaques/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("destaques", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Destaque).where(
            Destaque.id == id, Destaque.empresa_id == current_user.empresa_id, Destaque.deletado_em.is_(None)
        )
    )
    destaque = result.scalar_one_or_none()
    if not destaque:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Destaque não encontrado"})
    return {"data": DestaqueResponse.model_validate(destaque).model_dump()}


@router.put("/destaques/{id}")
async def atualizar(
    id: UUID,
    data: DestaqueUpdate,
    current_user: Usuario = Depends(check_permissao("destaques", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Destaque).where(
            Destaque.id == id, Destaque.empresa_id == current_user.empresa_id, Destaque.deletado_em.is_(None)
        )
    )
    destaque = result.scalar_one_or_none()
    if not destaque:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Destaque não encontrado"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(destaque, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "destaques", id)
    await db.commit()
    await db.refresh(destaque)
    return {"data": DestaqueResponse.model_validate(destaque).model_dump()}


@router.delete("/destaques/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("destaques", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Destaque).where(
            Destaque.id == id, Destaque.empresa_id == current_user.empresa_id, Destaque.deletado_em.is_(None)
        )
    )
    destaque = result.scalar_one_or_none()
    if not destaque:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Destaque não encontrado"})

    destaque.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "destaques", id)
    await db.commit()


@router.patch("/destaques/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("destaques", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Destaque)
            .where(Destaque.id == UUID(item.id), Destaque.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
