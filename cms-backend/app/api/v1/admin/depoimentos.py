from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Depoimento
from app.models.usuario import Usuario
from app.schemas.apresentacao import DepoimentoCreate, DepoimentoResponse, DepoimentoUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Depoimentos"])


@router.get("/depoimentos")
async def listar(
    current_user: Usuario = Depends(check_permissao("depoimentos", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("depoimentos", current_user.empresa_id, db)

    query = select(Depoimento).where(
        Depoimento.empresa_id == current_user.empresa_id,
        Depoimento.deletado_em.is_(None),
    ).order_by(Depoimento.ordem)

    if ativo is not None:
        query = query.where(Depoimento.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [DepoimentoResponse.model_validate(d).model_dump() for d in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/depoimentos", status_code=201)
async def criar(
    data: DepoimentoCreate,
    current_user: Usuario = Depends(check_permissao("depoimentos", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("depoimentos", current_user.empresa_id, db)

    depoimento = Depoimento(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(depoimento)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "depoimentos", depoimento.id)
    await db.commit()
    await db.refresh(depoimento)
    return {"data": DepoimentoResponse.model_validate(depoimento).model_dump()}


@router.get("/depoimentos/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("depoimentos", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Depoimento).where(
            Depoimento.id == id, Depoimento.empresa_id == current_user.empresa_id, Depoimento.deletado_em.is_(None)
        )
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Depoimento não encontrado"})
    return {"data": DepoimentoResponse.model_validate(depoimento).model_dump()}


@router.put("/depoimentos/{id}")
async def atualizar(
    id: UUID,
    data: DepoimentoUpdate,
    current_user: Usuario = Depends(check_permissao("depoimentos", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Depoimento).where(
            Depoimento.id == id, Depoimento.empresa_id == current_user.empresa_id, Depoimento.deletado_em.is_(None)
        )
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Depoimento não encontrado"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(depoimento, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "depoimentos", id)
    await db.commit()
    await db.refresh(depoimento)
    return {"data": DepoimentoResponse.model_validate(depoimento).model_dump()}


@router.delete("/depoimentos/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("depoimentos", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Depoimento).where(
            Depoimento.id == id, Depoimento.empresa_id == current_user.empresa_id, Depoimento.deletado_em.is_(None)
        )
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Depoimento não encontrado"})

    depoimento.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "depoimentos", id)
    await db.commit()


@router.patch("/depoimentos/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("depoimentos", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Depoimento)
            .where(Depoimento.id == UUID(item.id), Depoimento.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
