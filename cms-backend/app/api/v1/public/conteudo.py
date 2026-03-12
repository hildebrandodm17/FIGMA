from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.conteudo import Categoria, Post
from app.models.empresa import Empresa
from app.schemas.conteudo import PostPublicResponse, SeoResponse
from app.utils.pagination import paginar

router = APIRouter(tags=["Site - Conteúdo"])


@router.get("/posts")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def listar_posts(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
    tipo: str | None = None,
    categoria_slug: str | None = None,
    pagina: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=100),
):
    await verificar_modulo_ativo("posts", empresa.id, db)

    query = (
        select(Post)
        .options(selectinload(Post.categoria))
        .where(
            Post.empresa_id == empresa.id,
            Post.publicado == True,
            Post.deletado_em.is_(None),
        )
        .order_by(Post.publicado_em.desc())
    )

    if tipo:
        query = query.where(Post.tipo == tipo)

    if categoria_slug:
        query = query.join(Categoria).where(Categoria.slug == categoria_slug)

    items, meta = await paginar(db, query, pagina, limite)

    data = []
    for post in items:
        data.append({
            "id": str(post.id),
            "tipo": post.tipo,
            "titulo": post.titulo,
            "slug": post.slug,
            "resumo": post.resumo,
            "imagem_capa": post.imagem_capa,
            "autor": post.autor,
            "publicado_em": post.publicado_em.isoformat() if post.publicado_em else None,
            "categoria": {
                "id": str(post.categoria.id),
                "nome": post.categoria.nome,
                "slug": post.categoria.slug,
            } if post.categoria else None,
        })

    return {"data": data, "meta": meta.model_dump()}


@router.get("/posts/{slug}")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def obter_post(
    request: Request,
    slug: str,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("posts", empresa.id, db)

    result = await db.execute(
        select(Post)
        .options(selectinload(Post.categoria))
        .where(
            Post.empresa_id == empresa.id,
            Post.slug == slug,
            Post.publicado == True,
            Post.deletado_em.is_(None),
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        from fastapi import HTTPException
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Post não encontrado"})

    return {
        "data": {
            "id": str(post.id),
            "tipo": post.tipo,
            "titulo": post.titulo,
            "slug": post.slug,
            "resumo": post.resumo,
            "conteudo": post.conteudo,
            "imagem_capa": post.imagem_capa,
            "autor": post.autor,
            "publicado_em": post.publicado_em.isoformat() if post.publicado_em else None,
            "categoria": {
                "id": str(post.categoria.id),
                "nome": post.categoria.nome,
                "slug": post.categoria.slug,
            } if post.categoria else None,
            "seo": {
                "meta_title": post.meta_title,
                "meta_desc": post.meta_desc,
                "og_image": post.og_image,
                "og_title": post.og_title,
                "canonical_url": post.canonical_url,
                "indexavel": post.indexavel,
            },
        }
    }
