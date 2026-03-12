from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug, verificar_modulo_ativo
from app.middleware.rate_limit import limiter
from app.models.empresa import Empresa
from app.schemas.lead import LeadCreate, LeadPublicResponse
from app.services import lead_service

router = APIRouter(tags=["Site - Leads"])


@router.post("/leads", status_code=201)
@limiter.limit(settings.RATE_LIMIT_LEADS)
async def criar_lead(
    request: Request,
    data: LeadCreate,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("leads", empresa.id, db)

    ip = request.client.host if request.client else None
    lead = await lead_service.criar_lead(db, empresa.id, data, ip=ip)

    return {"data": LeadPublicResponse(id=str(lead.id))}
