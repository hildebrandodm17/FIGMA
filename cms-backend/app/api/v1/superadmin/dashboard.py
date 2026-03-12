from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.empresa import Empresa
from app.models.lead import Lead
from app.models.usuario import Usuario

router = APIRouter(tags=["SuperAdmin - Dashboard"])


@router.get("/dashboard")
async def dashboard(
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    # Total de empresas
    total_empresas = await db.execute(
        select(func.count(Empresa.id)).where(Empresa.deletado_em.is_(None))
    )
    empresas_ativas = await db.execute(
        select(func.count(Empresa.id)).where(Empresa.deletado_em.is_(None), Empresa.ativo == True)
    )

    # Leads do mês
    inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    leads_mes = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.deletado_em.is_(None), Lead.created_at >= inicio_mes
        )
    )
    leads_total = await db.execute(
        select(func.count(Lead.id)).where(Lead.deletado_em.is_(None))
    )

    # Usuários
    total_usuarios = await db.execute(
        select(func.count(Usuario.id)).where(Usuario.deletado_em.is_(None))
    )

    return {
        "data": {
            "empresas": {
                "total": total_empresas.scalar() or 0,
                "ativas": empresas_ativas.scalar() or 0,
            },
            "leads": {
                "total": leads_total.scalar() or 0,
                "mes_atual": leads_mes.scalar() or 0,
            },
            "usuarios": {
                "total": total_usuarios.scalar() or 0,
            },
        }
    }
