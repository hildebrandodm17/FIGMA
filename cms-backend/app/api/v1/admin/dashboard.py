from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.arquivo import Arquivo
from app.models.conteudo import Post
from app.models.item import Item
from app.models.lead import Lead
from app.models.usuario import Usuario
from app.services import lead_service

router = APIRouter(tags=["Admin - Dashboard"])


@router.get("/dashboard")
async def dashboard(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    empresa_id = current_user.empresa_id

    # Leads
    leads_total = await db.execute(
        select(func.count(Lead.id)).where(Lead.empresa_id == empresa_id, Lead.deletado_em.is_(None))
    )
    leads_respondidos = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.empresa_id == empresa_id, Lead.deletado_em.is_(None), Lead.respondido == True
        )
    )

    from datetime import datetime, timedelta, timezone
    trinta_dias = datetime.now(timezone.utc) - timedelta(days=30)
    leads_30d = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.empresa_id == empresa_id, Lead.deletado_em.is_(None),
            Lead.created_at >= trinta_dias
        )
    )

    total_leads = leads_total.scalar() or 0
    total_respondidos = leads_respondidos.scalar() or 0
    total_30d = leads_30d.scalar() or 0

    grafico = await lead_service.grafico_mensal(db, empresa_id)

    # Posts
    posts_total = await db.execute(
        select(func.count(Post.id)).where(Post.empresa_id == empresa_id, Post.deletado_em.is_(None))
    )
    posts_pub = await db.execute(
        select(func.count(Post.id)).where(
            Post.empresa_id == empresa_id, Post.deletado_em.is_(None), Post.publicado == True
        )
    )
    t_posts = posts_total.scalar() or 0
    t_pub = posts_pub.scalar() or 0

    # Itens
    itens_total = await db.execute(
        select(func.count(Item.id)).where(Item.empresa_id == empresa_id, Item.deletado_em.is_(None))
    )
    itens_ativos = await db.execute(
        select(func.count(Item.id)).where(
            Item.empresa_id == empresa_id, Item.deletado_em.is_(None), Item.ativo == True
        )
    )

    # Arquivos
    arq_total = await db.execute(
        select(func.count(Arquivo.id)).where(Arquivo.empresa_id == empresa_id, Arquivo.deletado_em.is_(None))
    )
    arq_tamanho = await db.execute(
        select(func.coalesce(func.sum(Arquivo.tamanho_bytes), 0)).where(
            Arquivo.empresa_id == empresa_id, Arquivo.deletado_em.is_(None)
        )
    )

    return {
        "data": {
            "leads": {
                "total": total_leads,
                "ativos": total_leads - total_respondidos,
                "respondidos": total_respondidos,
                "ultimos_30_dias": total_30d,
                "por_mes": grafico,
            },
            "posts": {"total": t_posts, "publicados": t_pub, "rascunhos": t_posts - t_pub},
            "itens": {"total": itens_total.scalar() or 0, "ativos": itens_ativos.scalar() or 0},
            "arquivos": {"total": arq_total.scalar() or 0, "tamanho_total_bytes": arq_tamanho.scalar() or 0},
        }
    }
