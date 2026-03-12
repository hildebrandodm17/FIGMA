import resend

from app.core.config import settings


async def enviar_email_lead(
    para: str,
    empresa_nome: str,
    lead_nome: str,
    lead_email: str,
    lead_telefone: str | None,
    lead_mensagem: str | None,
) -> None:
    """Envia e-mail de notificação de novo lead via Resend."""
    if not settings.RESEND_API_KEY:
        return

    resend.api_key = settings.RESEND_API_KEY

    corpo_html = f"""
    <h2>Novo lead recebido - {empresa_nome}</h2>
    <p><strong>Nome:</strong> {lead_nome}</p>
    <p><strong>E-mail:</strong> {lead_email}</p>
    <p><strong>Telefone:</strong> {lead_telefone or 'Não informado'}</p>
    <p><strong>Mensagem:</strong></p>
    <p>{lead_mensagem or 'Sem mensagem'}</p>
    <hr>
    <p><small>Este e-mail foi enviado automaticamente pelo CMS.</small></p>
    """

    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [para],
            "subject": f"Novo lead: {lead_nome} - {empresa_nome}",
            "html": corpo_html,
        })
    except Exception:
        pass  # Log em produção
