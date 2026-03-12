import csv
import io
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.lead import Lead
from app.models.usuario import Usuario
from app.schemas.lead import LeadResponse
from app.services import lead_service
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Leads"])


@router.get("/leads/export")
async def exportar_csv(
    current_user: Usuario = Depends(check_permissao("leads", "exportar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    result = await db.execute(
        select(Lead).where(
            Lead.empresa_id == current_user.empresa_id,
            Lead.deletado_em.is_(None),
        ).order_by(Lead.created_at.desc())
    )
    leads = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nome", "Email", "Telefone", "Mensagem", "Origem", "Respondido", "Data"])

    for lead in leads:
        writer.writerow([
            lead.nome,
            lead.email,
            lead.telefone or "",
            lead.mensagem or "",
            lead.origem or "",
            "Sim" if lead.respondido else "Não",
            lead.created_at.strftime("%d/%m/%Y %H:%M") if lead.created_at else "",
        ])

    output.seek(0)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "exportar", "leads")
    await db.commit()

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@router.get("/leads/grafico")
async def grafico(
    current_user: Usuario = Depends(check_permissao("leads", "ver")),
    db: AsyncSession = Depends(get_db),
    ano: int | None = None,
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    dados = await lead_service.grafico_mensal(db, current_user.empresa_id, ano)
    return {"data": dados}


@router.get("/leads")
async def listar(
    current_user: Usuario = Depends(check_permissao("leads", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    respondido: bool | None = None,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
    busca: str | None = None,
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    query = select(Lead).where(
        Lead.empresa_id == current_user.empresa_id,
        Lead.deletado_em.is_(None),
    ).order_by(Lead.created_at.desc())

    if respondido is not None:
        query = query.where(Lead.respondido == respondido)

    if data_inicio is not None:
        query = query.where(Lead.created_at >= data_inicio)

    if data_fim is not None:
        query = query.where(Lead.created_at <= data_fim)

    if busca:
        filtro_busca = f"%{busca}%"
        query = query.where(
            Lead.nome.ilike(filtro_busca) | Lead.email.ilike(filtro_busca) | Lead.telefone.ilike(filtro_busca)
        )

    items, meta = await paginar(db, query, pagina, limite)
    data = [LeadResponse.model_validate(l).model_dump() for l in items]
    return {"data": data, "meta": meta.model_dump()}


@router.get("/leads/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("leads", "ver")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    result = await db.execute(
        select(Lead).where(
            Lead.id == id, Lead.empresa_id == current_user.empresa_id, Lead.deletado_em.is_(None)
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Lead não encontrado"})
    return {"data": LeadResponse.model_validate(lead).model_dump()}


@router.put("/leads/{id}")
async def atualizar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("leads", "editar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    lead = await lead_service.marcar_respondido(db, id, current_user.empresa_id, current_user.id)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "leads", id)
    await db.commit()
    return {"data": LeadResponse.model_validate(lead).model_dump()}


@router.delete("/leads/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("leads", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("leads", current_user.empresa_id, db)

    result = await db.execute(
        select(Lead).where(
            Lead.id == id, Lead.empresa_id == current_user.empresa_id, Lead.deletado_em.is_(None)
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Lead não encontrado"})

    lead.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "leads", id)
    await db.commit()
