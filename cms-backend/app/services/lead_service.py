import hashlib
import hmac
import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.empresa import Empresa
from app.models.lead import Lead
from app.schemas.lead import LeadCreate


async def criar_lead(
    db: AsyncSession,
    empresa_id: UUID,
    data: LeadCreate,
    ip: str | None = None,
) -> Lead:
    """Salva lead, dispara notificações em background."""
    lead = Lead(
        empresa_id=empresa_id,
        nome=data.nome,
        email=data.email,
        telefone=data.telefone,
        mensagem=data.mensagem,
        origem=data.origem,
        ip_origem=ip,
        lgpd_aceito=data.lgpd_aceito,
        lgpd_aceito_em=datetime.now(timezone.utc),
        lgpd_ip=ip,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    # Notificações assíncronas (não bloqueia resposta)
    empresa_result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = empresa_result.scalar_one_or_none()

    if empresa:
        # Dispara webhook se configurado
        if empresa.webhook_leads and empresa.webhook_secret:
            import asyncio
            asyncio.create_task(_disparar_webhook(empresa, lead))

    return lead


async def marcar_respondido(
    db: AsyncSession,
    lead_id: UUID,
    empresa_id: UUID,
    usuario_id: UUID,
) -> Lead:
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.empresa_id == empresa_id,
            Lead.deletado_em.is_(None),
        )
    )
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Lead não encontrado"})

    lead.respondido = True
    lead.respondido_em = datetime.now(timezone.utc)
    lead.respondido_por = usuario_id
    await db.commit()
    await db.refresh(lead)
    return lead


async def grafico_mensal(
    db: AsyncSession,
    empresa_id: UUID,
    ano: int | None = None,
) -> list[dict]:
    """Retorna totais de leads por mês para o gráfico."""
    if not ano:
        ano = datetime.now().year

    meses_pt = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ]

    result = await db.execute(
        select(
            extract("month", Lead.created_at).label("mes"),
            func.count(Lead.id).label("total"),
        )
        .where(
            Lead.empresa_id == empresa_id,
            Lead.deletado_em.is_(None),
            extract("year", Lead.created_at) == ano,
        )
        .group_by(extract("month", Lead.created_at))
        .order_by(extract("month", Lead.created_at))
    )

    dados_banco = {int(row.mes): row.total for row in result}

    return [
        {"mes": meses_pt[i], "total": dados_banco.get(i + 1, 0)}
        for i in range(12)
    ]


async def _disparar_webhook(empresa: Empresa, lead: Lead) -> None:
    """Envia webhook com HMAC-SHA256."""
    import httpx

    payload = {
        "evento": "novo_lead",
        "lead": {
            "id": str(lead.id),
            "nome": lead.nome,
            "email": lead.email,
            "telefone": lead.telefone,
            "mensagem": lead.mensagem,
            "origem": lead.origem,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
        },
    }

    corpo = json.dumps(payload, separators=(",", ":")).encode()
    assinatura = hmac.new(
        empresa.webhook_secret.encode(), corpo, hashlib.sha256
    ).hexdigest()

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                empresa.webhook_leads,
                json=payload,
                headers={"X-CMS-Signature": f"sha256={assinatura}"},
            )
    except Exception:
        pass  # Log em produção, não bloqueia
