from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.apresentacao import Faq
from app.models.usuario import Usuario
from app.schemas.apresentacao import FaqCreate, FaqResponse, FaqUpdate
from app.schemas.base import ReordenarRequest
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - FAQ"])


@router.get("/faq")
async def listar(
    current_user: Usuario = Depends(check_permissao("faq", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
):
    await verificar_modulo_ativo("faq", current_user.empresa_id, db)

    query = select(Faq).where(
        Faq.empresa_id == current_user.empresa_id,
        Faq.deletado_em.is_(None),
    ).order_by(Faq.ordem)

    if ativo is not None:
        query = query.where(Faq.ativo == ativo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [FaqResponse.model_validate(f).model_dump() for f in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/faq", status_code=201)
async def criar(
    data: FaqCreate,
    current_user: Usuario = Depends(check_permissao("faq", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("faq", current_user.empresa_id, db)

    faq = Faq(empresa_id=current_user.empresa_id, **data.model_dump())
    db.add(faq)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "faq", faq.id)
    await db.commit()
    await db.refresh(faq)
    return {"data": FaqResponse.model_validate(faq).model_dump()}


@router.get("/faq/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("faq", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Faq).where(
            Faq.id == id, Faq.empresa_id == current_user.empresa_id, Faq.deletado_em.is_(None)
        )
    )
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "FAQ não encontrada"})
    return {"data": FaqResponse.model_validate(faq).model_dump()}


@router.put("/faq/{id}")
async def atualizar(
    id: UUID,
    data: FaqUpdate,
    current_user: Usuario = Depends(check_permissao("faq", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Faq).where(
            Faq.id == id, Faq.empresa_id == current_user.empresa_id, Faq.deletado_em.is_(None)
        )
    )
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "FAQ não encontrada"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(faq, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "faq", id)
    await db.commit()
    await db.refresh(faq)
    return {"data": FaqResponse.model_validate(faq).model_dump()}


@router.delete("/faq/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("faq", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Faq).where(
            Faq.id == id, Faq.empresa_id == current_user.empresa_id, Faq.deletado_em.is_(None)
        )
    )
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "FAQ não encontrada"})

    faq.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "faq", id)
    await db.commit()


@router.patch("/faq/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("faq", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Faq)
            .where(Faq.id == UUID(item.id), Faq.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
