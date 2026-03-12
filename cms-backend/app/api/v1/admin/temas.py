from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.usuario import Usuario
from app.schemas.configuracao import TemaResponse, TemaUpdate
from app.services import configuracao_service

router = APIRouter(tags=["Admin - Temas"])


@router.get("/temas")
async def obter(
    current_user: Usuario = Depends(check_permissao("temas", "ver")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("temas", current_user.empresa_id, db)

    tema = await configuracao_service.obter_tema(db, current_user.empresa_id)
    if not tema:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Tema não encontrado"})
    return {"data": TemaResponse.model_validate(tema).model_dump()}


@router.put("/temas")
async def atualizar(
    data: TemaUpdate,
    current_user: Usuario = Depends(check_permissao("temas", "editar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("temas", current_user.empresa_id, db)

    tema = await configuracao_service.atualizar_tema(
        db, current_user.empresa_id, data.model_dump(exclude_unset=True)
    )
    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "temas", tema.id)
    await db.commit()
    return {"data": TemaResponse.model_validate(tema).model_dump()}
