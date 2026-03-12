from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.item import Item
from app.models.usuario import Usuario
from app.schemas.base import ReordenarRequest
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.utils.pagination import paginar
from app.utils.slug import gerar_slug_unico

router = APIRouter(tags=["Admin - Itens"])


@router.get("/itens")
async def listar(
    current_user: Usuario = Depends(check_permissao("itens", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    ativo: bool | None = None,
    busca: str | None = None,
):
    await verificar_modulo_ativo("itens", current_user.empresa_id, db)

    query = (
        select(Item).options(selectinload(Item.categoria))
        .where(Item.empresa_id == current_user.empresa_id, Item.deletado_em.is_(None))
    )
    if ativo is not None:
        query = query.where(Item.ativo == ativo)
    if busca:
        query = query.where(Item.nome.ilike(f"%{busca}%"))
    query = query.order_by(Item.ordem)

    items, meta = await paginar(db, query, pagina, limite)
    data = [ItemResponse.model_validate(i).model_dump() for i in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/itens", status_code=201)
async def criar(
    data: ItemCreate,
    current_user: Usuario = Depends(check_permissao("itens", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("itens", current_user.empresa_id, db)

    slug = data.slug or await gerar_slug_unico(db, Item, data.nome, current_user.empresa_id)
    item_data = data.model_dump(exclude={"slug", "categoria_id"})
    item = Item(empresa_id=current_user.empresa_id, slug=slug, **item_data)
    if data.categoria_id:
        item.categoria_id = UUID(data.categoria_id)

    db.add(item)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "itens", item.id)
    await db.commit()
    await db.refresh(item, ["categoria"])
    return {"data": ItemResponse.model_validate(item).model_dump()}


@router.get("/itens/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("itens", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).options(selectinload(Item.categoria)).where(
            Item.id == id, Item.empresa_id == current_user.empresa_id, Item.deletado_em.is_(None)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item não encontrado"})
    return {"data": ItemResponse.model_validate(item).model_dump()}


@router.put("/itens/{id}")
async def atualizar(
    id: UUID,
    data: ItemUpdate,
    current_user: Usuario = Depends(check_permissao("itens", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(
            Item.id == id, Item.empresa_id == current_user.empresa_id,
            Item.versao == data.versao, Item.deletado_em.is_(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(409, detail={"codigo": "CONFLITO_VERSAO", "mensagem": "Conflito: registro foi alterado por outro usuário"})

    update_data = data.model_dump(exclude_unset=True, exclude={"versao"})
    for campo, valor in update_data.items():
        if campo == "categoria_id" and valor:
            setattr(item, campo, UUID(valor))
        else:
            setattr(item, campo, valor)
    item.versao += 1

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "itens", id)
    await db.commit()
    await db.refresh(item, ["categoria"])
    return {"data": ItemResponse.model_validate(item).model_dump()}


@router.delete("/itens/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("itens", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(
            Item.id == id, Item.empresa_id == current_user.empresa_id, Item.deletado_em.is_(None)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Item não encontrado"})

    item.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "itens", id)
    await db.commit()


@router.patch("/itens/reordenar")
async def reordenar(
    data: ReordenarRequest,
    current_user: Usuario = Depends(check_permissao("itens", "editar")),
    db: AsyncSession = Depends(get_db),
):
    for item in data.ordem:
        await db.execute(
            update(Item)
            .where(Item.id == UUID(item.id), Item.empresa_id == current_user.empresa_id)
            .values(ordem=item.ordem)
        )
    await db.commit()
    return {"data": {"mensagem": "Ordem atualizada"}}
