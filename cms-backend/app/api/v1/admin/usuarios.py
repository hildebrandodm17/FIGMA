from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_role, verificar_modulo_ativo
from app.core.security import hash_senha
from app.middleware.audit import registrar_audit
from app.models.usuario import Usuario, UsuarioPermissao
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Usuários"])


@router.get("/usuarios")
async def listar(
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
):
    await verificar_modulo_ativo("usuarios", current_user.empresa_id, db)

    query = (
        select(Usuario)
        .options(selectinload(Usuario.permissoes))
        .where(
            Usuario.empresa_id == current_user.empresa_id,
            Usuario.deletado_em.is_(None),
        )
        .order_by(Usuario.created_at.desc())
    )

    items, meta = await paginar(db, query, pagina, limite)
    data = [UsuarioResponse.model_validate(u).model_dump() for u in items]
    return {"data": data, "meta": meta.model_dump()}


@router.post("/usuarios", status_code=201)
async def criar(
    data: UsuarioCreate,
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("usuarios", current_user.empresa_id, db)

    # Verificar email único
    result = await db.execute(
        select(Usuario).where(Usuario.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(409, detail={"codigo": "CONFLITO_SLUG", "mensagem": "E-mail já está em uso"})

    usuario = Usuario(
        empresa_id=current_user.empresa_id,
        nome=data.nome,
        email=data.email,
        senha_hash=hash_senha(data.senha),
        role=data.role,
    )
    db.add(usuario)
    await db.flush()

    # Criar permissões
    if data.permissoes:
        for modulo, perm in data.permissoes.items():
            permissao = UsuarioPermissao(
                usuario_id=usuario.id,
                modulo=modulo,
                pode_ver=perm.pode_ver,
                pode_criar=perm.pode_criar,
                pode_editar=perm.pode_editar,
                pode_deletar=perm.pode_deletar,
                pode_exportar=perm.pode_exportar,
            )
            db.add(permissao)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "usuarios", usuario.id)
    await db.commit()

    # Recarregar com permissões
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.permissoes)).where(Usuario.id == usuario.id)
    )
    usuario = result.scalar_one()
    return {"data": UsuarioResponse.model_validate(usuario).model_dump()}


@router.put("/usuarios/{id}")
async def atualizar(
    id: UUID,
    data: UsuarioUpdate,
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("usuarios", current_user.empresa_id, db)

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.permissoes))
        .where(
            Usuario.id == id,
            Usuario.empresa_id == current_user.empresa_id,
            Usuario.deletado_em.is_(None),
        )
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Usuário não encontrado"})

    # Verificar email único se mudou
    if data.email and data.email != usuario.email:
        email_check = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != id)
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(409, detail={"codigo": "CONFLITO_SLUG", "mensagem": "E-mail já está em uso"})

    update_data = data.model_dump(exclude_unset=True, exclude={"senha", "permissoes"})
    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)

    if data.senha:
        usuario.senha_hash = hash_senha(data.senha)

    # Atualizar permissões se fornecidas
    if data.permissoes is not None:
        # Remover permissões antigas
        for perm in usuario.permissoes:
            await db.delete(perm)
        await db.flush()

        # Criar novas permissões
        for modulo, perm in data.permissoes.items():
            permissao = UsuarioPermissao(
                usuario_id=usuario.id,
                modulo=modulo,
                pode_ver=perm.pode_ver,
                pode_criar=perm.pode_criar,
                pode_editar=perm.pode_editar,
                pode_deletar=perm.pode_deletar,
                pode_exportar=perm.pode_exportar,
            )
            db.add(permissao)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "usuarios", id)
    await db.commit()

    # Recarregar com permissões
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.permissoes)).where(Usuario.id == id)
    )
    usuario = result.scalar_one()
    return {"data": UsuarioResponse.model_validate(usuario).model_dump()}


@router.delete("/usuarios/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("usuarios", current_user.empresa_id, db)

    result = await db.execute(
        select(Usuario).where(
            Usuario.id == id,
            Usuario.empresa_id == current_user.empresa_id,
            Usuario.deletado_em.is_(None),
        )
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Usuário não encontrado"})

    # Impedir auto-exclusão
    if usuario.id == current_user.id:
        raise HTTPException(400, detail={"codigo": "ERRO_VALIDACAO", "mensagem": "Não é possível deletar o próprio usuário"})

    usuario.deletado_em = datetime.now(timezone.utc)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "usuarios", id)
    await db.commit()
