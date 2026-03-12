from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.conteudo import Post
from app.models.usuario import Usuario
from app.schemas.conteudo import PostCreate, PostResponse, PostUpdate
from app.utils.pagination import paginar
from app.utils.slug import gerar_slug_unico

router = APIRouter(tags=["Admin - Posts"])


@router.get("/posts")
async def listar(
    current_user: Usuario = Depends(check_permissao("posts", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    tipo: str | None = None,
    publicado: bool | None = None,
    categoria_id: str | None = None,
    busca: str | None = None,
):
    await verificar_modulo_ativo("posts", current_user.empresa_id, db)

    query = (
        select(Post)
        .options(selectinload(Post.categoria))
        .where(Post.empresa_id == current_user.empresa_id, Post.deletado_em.is_(None))
    )

    if tipo:
        query = query.where(Post.tipo == tipo)
    if publicado is not None:
        query = query.where(Post.publicado == publicado)
    if categoria_id:
        query = query.where(Post.categoria_id == UUID(categoria_id))
    if busca:
        query = query.where(Post.titulo.ilike(f"%{busca}%"))

    query = query.order_by(Post.created_at.desc())
    items, meta = await paginar(db, query, pagina, limite)
    data = [PostResponse.model_validate(p).model_dump() for p in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/posts", status_code=201)
async def criar(
    data: PostCreate,
    current_user: Usuario = Depends(check_permissao("posts", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("posts", current_user.empresa_id, db)

    slug = data.slug or await gerar_slug_unico(db, Post, data.titulo, current_user.empresa_id)

    post_data = data.model_dump(exclude={"slug"})
    if data.categoria_id:
        post_data["categoria_id"] = UUID(data.categoria_id)

    post = Post(empresa_id=current_user.empresa_id, slug=slug, **{k: v for k, v in post_data.items() if k != "categoria_id" or v is not None})
    if data.categoria_id:
        post.categoria_id = UUID(data.categoria_id)

    if data.publicado and not data.publicado_em:
        post.publicado_em = datetime.now(timezone.utc)

    db.add(post)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "posts", post.id)
    await db.commit()
    await db.refresh(post, ["categoria"])
    return {"data": PostResponse.model_validate(post).model_dump()}


@router.get("/posts/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("posts", "ver")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).options(selectinload(Post.categoria)).where(
            Post.id == id, Post.empresa_id == current_user.empresa_id, Post.deletado_em.is_(None)
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Post não encontrado"})
    return {"data": PostResponse.model_validate(post).model_dump()}


@router.put("/posts/{id}")
async def atualizar(
    id: UUID,
    data: PostUpdate,
    current_user: Usuario = Depends(check_permissao("posts", "editar")),
    db: AsyncSession = Depends(get_db),
):
    # Optimistic locking
    result = await db.execute(
        select(Post).where(
            Post.id == id,
            Post.empresa_id == current_user.empresa_id,
            Post.versao == data.versao,
            Post.deletado_em.is_(None),
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(409, detail={"codigo": "CONFLITO_VERSAO", "mensagem": "Conflito: registro foi alterado por outro usuário"})

    update_data = data.model_dump(exclude_unset=True, exclude={"versao"})
    for campo, valor in update_data.items():
        if campo == "categoria_id" and valor:
            setattr(post, campo, UUID(valor))
        else:
            setattr(post, campo, valor)

    post.versao += 1

    if data.publicado and not post.publicado_em:
        post.publicado_em = datetime.now(timezone.utc)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "posts", id)
    await db.commit()
    await db.refresh(post, ["categoria"])
    return {"data": PostResponse.model_validate(post).model_dump()}


@router.delete("/posts/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("posts", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(
            Post.id == id, Post.empresa_id == current_user.empresa_id, Post.deletado_em.is_(None)
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Post não encontrado"})

    post.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "posts", id)
    await db.commit()
