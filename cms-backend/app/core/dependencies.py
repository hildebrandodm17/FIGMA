from uuid import UUID

from fastapi import Depends, Header, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import empresa_cache, modulos_cache
from app.core.database import get_db
from app.core.security import verificar_token
from app.models.empresa import Empresa
from app.models.empresa_modulo import EmpresaModulo
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Extrai e valida o usuário do access token JWT."""
    try:
        payload = verificar_token(token, tipo_esperado="access")
    except JWTError:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Token inválido ou expirado"})

    usuario_id = payload.get("sub")
    if not usuario_id:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Token inválido"})

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.permissoes))
        .where(Usuario.id == UUID(usuario_id))
    )
    usuario = result.scalar_one_or_none()

    if not usuario or not usuario.ativo or usuario.deletado_em:
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Usuário inativo ou não encontrado"})

    return usuario


def require_role(*roles: str):
    """Dependency factory que exige um ou mais roles específicos."""
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.role not in roles:
            raise HTTPException(403, detail={"codigo": "NAO_AUTORIZADO", "mensagem": "Permissão insuficiente"})
        return current_user
    return dependency


def check_permissao(modulo: str, acao: str):
    """Dependency factory que verifica permissão granular por módulo e ação."""
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        # SuperAdmin e Admin têm acesso total
        if current_user.role in ("superadmin", "admin"):
            return current_user

        # Usuario verifica permissão específica
        campo = f"pode_{acao}"
        for perm in current_user.permissoes:
            if perm.modulo == modulo and getattr(perm, campo, False):
                return current_user

        raise HTTPException(403, detail={"codigo": "NAO_AUTORIZADO", "mensagem": f"Sem permissão para {acao} em {modulo}"})
    return dependency


async def get_empresa_from_slug(
    x_empresa_slug: str = Header(..., alias="X-Empresa-Slug"),
    db: AsyncSession = Depends(get_db),
) -> Empresa:
    """Extrai empresa do header X-Empresa-Slug (endpoints públicos)."""
    # Verificar cache
    cached = empresa_cache.get(x_empresa_slug)
    if cached:
        return cached

    result = await db.execute(
        select(Empresa).where(
            Empresa.slug == x_empresa_slug,
            Empresa.ativo == True,
            Empresa.deletado_em.is_(None),
        )
    )
    empresa = result.scalar_one_or_none()

    if not empresa:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Empresa não encontrada"})

    empresa_cache[x_empresa_slug] = empresa
    return empresa


async def verificar_modulo_ativo(
    modulo: str,
    empresa_id: UUID,
    db: AsyncSession,
) -> None:
    """Verifica se o módulo está ativo para a empresa. Levanta 404 se inativo."""
    cache_key = f"{empresa_id}:{modulo}"
    cached = modulos_cache.get(cache_key)
    if cached is not None:
        if not cached:
            raise HTTPException(404, detail={"codigo": "MODULO_INATIVO", "mensagem": f"Módulo '{modulo}' não está ativo"})
        return

    result = await db.execute(
        select(EmpresaModulo).where(
            EmpresaModulo.empresa_id == empresa_id,
            EmpresaModulo.modulo == modulo,
            EmpresaModulo.ativo == True,
        )
    )
    ativo = result.scalar_one_or_none() is not None
    modulos_cache[cache_key] = ativo

    if not ativo:
        raise HTTPException(404, detail={"codigo": "MODULO_INATIVO", "mensagem": f"Módulo '{modulo}' não está ativo"})
