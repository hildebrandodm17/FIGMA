from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Equipe
from app.models.usuario import Usuario
from app.schemas.apresentacao import EquipeCreate, EquipeResponse, EquipeUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Equipe"])


@router.get("/equipe")
async def listar(
    current_user: Usuario = Depends(check_permissao("equipe", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("equipe", current_user.empresa_id, db)

    query = select(Equipe).where(
        Equipe.empresa_id == current_user.empresa_id,
        Equipe.deletado_em.is_(None),
    ).order_by(Equipe.ordem)

    if ativo is not None:
        query = query.where(Equipe.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [EquipeResponse.model_validate(e).model_dump() for e in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/equipe", status_code=201)
async def criar(
    data: EquipeCreate,
    current_user: Usuario = Depends(check_permissao("equipe", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("equipe", current_user.empresa_id, db)

    membro = Equipe(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(membro)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "equipe", membro.id)
    await db.commit()
    await db.refresh(membro)
    return {"data": EquipeResponse.model_validate(membro).model_dump()}


@router.get("/equipe/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("equipe", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Equipe).where(
            Equipe.id == id, Equipe.empresa_id == current_user.empresa_id, Equipe.deletado_em.is_(None)
        )
    )
    membro = result.scalar_one_or_none()
    if not membro:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Membro da equipe não encontrado"})
    return {"data": EquipeResponse.model_validate(membro).model_dump()}


@router.put("/equipe/{id}")
async def atualizar(
    id: UUID,
    data: EquipeUpdate,
    current_user: Usuario = Depends(check_permissao("equipe", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Equipe).where(
            Equipe.id == id, Equipe.empresa_id == current_user.empresa_id, Equipe.deletado_em.is_(None)
        )
    )
    membro = result.scalar_one_or_none()
    if not membro:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Membro da equipe não encontrado"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(membro, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "equipe", id)
    await db.commit()
    await db.refresh(membro)
    return {"data": EquipeResponse.model_validate(membro).model_dump()}


@router.delete("/equipe/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("equipe", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Equipe).where(
            Equipe.id == id, Equipe.empresa_id == current_user.empresa_id, Equipe.deletado_em.is_(None)
        )
    )
    membro = result.scalar_one_or_none()
    if not membro:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Membro da equipe não encontrado"})

    membro.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "equipe", id)
    await db.commit()


@router.patch("/equipe/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("equipe", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Equipe)
            .where(Equipe.id == UUID(item.id), Equipe.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
