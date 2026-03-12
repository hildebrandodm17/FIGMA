from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.contato import Contato
from app.models.usuario import Usuario
from app.schemas.contato import ContatoResponse, ContatoUpdate

router = APIRouter(tags=["Admin - Contatos"])


@router.get("/contatos")
async def obter(
    current_user: Usuario = Depends(check_permissao("contatos", "ver")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("contatos", current_user.empresa_id, db)

    result = await db.execute(
        select(Contato).where(Contato.empresa_id == current_user.empresa_id)
    )
    contato = result.scalar_one_or_none()
    if not contato:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Contato não encontrado"})
    return {"data": ContatoResponse.model_validate(contato).model_dump()}


@router.put("/contatos")
async def atualizar(
    data: ContatoUpdate,
    current_user: Usuario = Depends(check_permissao("contatos", "editar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("contatos", current_user.empresa_id, db)

    result = await db.execute(
        select(Contato).where(Contato.empresa_id == current_user.empresa_id)
    )
    contato = result.scalar_one_or_none()
    if not contato:
        # Cria registro de contato se não existir
        contato = Contato(empresa_id=current_user.empresa_id)
        db.add(contato)

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(contato, campo, valor)

    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "contatos", contato.id)
    await db.commit()
    await db.refresh(contato)
    return {"data": ContatoResponse.model_validate(contato).model_dump()}
