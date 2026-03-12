from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    criar_access_token,
    criar_refresh_token,
    hash_senha,
    hash_token,
    verificar_senha,
    verificar_token,
)
from app.middleware.audit import registrar_audit
from app.models.usuario import RefreshToken, Usuario
from app.schemas.auth import TokenResponse, UsuarioToken


async def login(
    db: AsyncSession,
    email: str,
    senha: str,
    ip: str | None = None,
    user_agent: str | None = None,
) -> tuple[TokenResponse, str]:
    """Autentica usuário. Retorna (token_response, refresh_token_raw)."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.permissoes), selectinload(Usuario.empresa))
        .where(Usuario.email == email, Usuario.deletado_em.is_(None))
    )
    usuario = result.scalar_one_or_none()

    if not usuario or not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "E-mail ou senha incorretos"})

    if not usuario.ativo:
        raise HTTPException(403, detail={"codigo": "NAO_AUTORIZADO", "mensagem": "Conta desativada"})

    # Montar permissões para o token
    permissoes = _montar_permissoes(usuario)

    # Criar tokens
    access_token = criar_access_token(
        sub=str(usuario.id),
        empresa_id=str(usuario.empresa_id) if usuario.empresa_id else None,
        role=usuario.role,
        permissoes=permissoes,
    )

    refresh_token_raw, jti = criar_refresh_token(sub=str(usuario.id))

    # Salvar hash do refresh token
    refresh_entry = RefreshToken(
        usuario_id=usuario.id,
        token_hash=hash_token(jti),
        ip=ip,
        user_agent=user_agent,
        expira_em=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )
    db.add(refresh_entry)

    # Atualizar último acesso
    usuario.ultimo_acesso = datetime.now(timezone.utc)

    await registrar_audit(db, usuario.id, usuario.empresa_id, "login", ip=ip)
    await db.commit()

    empresa_nome = usuario.empresa.nome if usuario.empresa else None

    token_response = TokenResponse(
        access_token=access_token,
        expira_em=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        usuario=UsuarioToken(
            id=str(usuario.id),
            nome=usuario.nome,
            email=usuario.email,
            role=usuario.role,
            empresa_id=str(usuario.empresa_id) if usuario.empresa_id else None,
            empresa_nome=empresa_nome,
            permissoes=permissoes,
        ),
    )

    return token_response, refresh_token_raw


async def refresh(
    db: AsyncSession,
    refresh_token_raw: str,
    ip: str | None = None,
    user_agent: str | None = None,
) -> tuple[TokenResponse, str]:
    """Rotaciona o refresh token e retorna novos tokens."""
    try:
        payload = verificar_token(refresh_token_raw, tipo_esperado="refresh")
    except Exception:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Refresh token inválido"})

    jti = payload.get("jti")
    usuario_id = payload.get("sub")

    if not jti or not usuario_id:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Token malformado"})

    jti_hash = hash_token(jti)

    # Buscar token no banco
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == jti_hash)
    )
    token_entry = result.scalar_one_or_none()

    if not token_entry:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Token não encontrado"})

    # Detecção de roubo: token já foi revogado
    if token_entry.revogado:
        # Revogar TODOS os tokens do usuário
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.usuario_id == token_entry.usuario_id)
            .values(revogado=True)
        )
        await db.commit()
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Possível roubo de token detectado. Faça login novamente."})

    # Revogar token atual
    token_entry.revogado = True

    # Buscar usuário
    user_result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.permissoes), selectinload(Usuario.empresa))
        .where(Usuario.id == UUID(usuario_id))
    )
    usuario = user_result.scalar_one_or_none()

    if not usuario or not usuario.ativo or usuario.deletado_em:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Usuário inativo"})

    permissoes = _montar_permissoes(usuario)

    # Novos tokens
    access_token = criar_access_token(
        sub=str(usuario.id),
        empresa_id=str(usuario.empresa_id) if usuario.empresa_id else None,
        role=usuario.role,
        permissoes=permissoes,
    )

    new_refresh_raw, new_jti = criar_refresh_token(sub=str(usuario.id))

    new_entry = RefreshToken(
        usuario_id=usuario.id,
        token_hash=hash_token(new_jti),
        ip=ip,
        user_agent=user_agent,
        expira_em=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )
    db.add(new_entry)
    await db.commit()

    empresa_nome = usuario.empresa.nome if usuario.empresa else None

    token_response = TokenResponse(
        access_token=access_token,
        expira_em=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        usuario=UsuarioToken(
            id=str(usuario.id),
            nome=usuario.nome,
            email=usuario.email,
            role=usuario.role,
            empresa_id=str(usuario.empresa_id) if usuario.empresa_id else None,
            empresa_nome=empresa_nome,
            permissoes=permissoes,
        ),
    )

    return token_response, new_refresh_raw


async def logout(db: AsyncSession, refresh_token_raw: str) -> None:
    """Revoga o refresh token atual."""
    try:
        payload = verificar_token(refresh_token_raw, tipo_esperado="refresh")
    except Exception:
        return  # Ignora erros no logout

    jti = payload.get("jti")
    if not jti:
        return

    jti_hash = hash_token(jti)
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == jti_hash)
        .values(revogado=True)
    )
    await db.commit()


def _montar_permissoes(usuario: Usuario) -> dict:
    """Monta dict de permissões para o JWT."""
    if usuario.role in ("superadmin", "admin"):
        return {}

    permissoes = {}
    for perm in usuario.permissoes:
        acoes = []
        if perm.pode_ver:
            acoes.append("ver")
        if perm.pode_criar:
            acoes.append("criar")
        if perm.pode_editar:
            acoes.append("editar")
        if perm.pode_deletar:
            acoes.append("deletar")
        if perm.pode_exportar:
            acoes.append("exportar")
        if acoes:
            permissoes[perm.modulo] = acoes

    return permissoes
