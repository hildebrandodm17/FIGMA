from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.conteudo import Categoria
from app.models.usuario import Usuario
from app.schemas.conteudo import CategoriaCreate, CategoriaResponse, CategoriaUpdate
from app.utils.pagination import paginar
from app.utils.slug import gerar_slug

router = APIRouter(tags=["Admin - Categorias"])


@router.get("/categorias")
async def listar(
    current_user: Usuario = Depends(check_permissao("categorias", "ver")),
    db: AsyncSession = Depends(get_db),
    tipo: str | None = None,
    pagina: int = Query(1, ge=1),
    limite: int = Query(50, ge=1, le=100),
):
    await verificar_modulo_ativo("categorias", current_user.empresa_id, db)

    query = select(Categoria).where(
        Categoria.empresa_id == current_user.empresa_id, Categoria.deletado_em.is_(None)
    )
    if tipo:
        query = query.where(Categoria.tipo == tipo)
    query = query.order_by(Categoria.nome)

    items, meta = await paginar(db, query, pagina, limite)
    data = [CategoriaResponse.model_validate(c).model_dump() for c in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/categorias", status_code=201)
async def criar(
    data: CategoriaCreate,
    current_user: Usuario = Depends(check_permissao("categorias", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("categorias", current_user.empresa_id, db)

    slug = data.slug or gerar_slug(data.nome)

    cat = Categoria(
        empresa_id=current_user.empresa_id,
        nome=data.nome,
        slug=slug,
        tipo=data.tipo,
        ativo=data.ativo,
    )
    db.add(cat)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "categorias", cat.id)
    await db.commit()
    await db.refresh(cat)
    return {"data": CategoriaResponse.model_validate(cat).model_dump()}


@router.put("/categorias/{id}")
async def atualizar(
    id: UUID,
    data: CategoriaUpdate,
    current_user: Usuario = Depends(check_permissao("categorias", "editar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Categoria).where(
            Categoria.id == id, Categoria.empresa_id == current_user.empresa_id, Categoria.deletado_em.is_(None)
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Categoria não encontrada"})

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(cat, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "categorias", id)
    await db.commit()
    await db.refresh(cat)
    return {"data": CategoriaResponse.model_validate(cat).model_dump()}


@router.delete("/categorias/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("categorias", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Categoria).where(
            Categoria.id == id, Categoria.empresa_id == current_user.empresa_id, Categoria.deletado_em.is_(None)
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Categoria não encontrada"})

    cat.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "categorias", id)
    await db.commit()
