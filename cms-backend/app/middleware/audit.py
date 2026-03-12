from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def registrar_audit(
    db: AsyncSession,
    usuario_id: UUID | None,
    empresa_id: UUID | None,
    acao: str,
    tabela: str | None = None,
    registro_id: UUID | None = None,
    dados_antes: dict | None = None,
    dados_depois: dict | None = None,
    ip: str | None = None,
) -> None:
    """Registra uma ação no audit log."""
    log = AuditLog(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        acao=acao,
        tabela=tabela,
        registro_id=registro_id,
        dados_antes=dados_antes,
        dados_depois=dados_depois,
        ip=ip,
    )
    db.add(log)
    await db.flush()
