from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.models.usuario import Usuario
from app.schemas.configuracao import ConfiguracaoNovaChaveRequest, ConfiguracaoSecaoResponse, ConfiguracaoUpdateRequest
from app.services import configuracao_service

router = APIRouter(tags=["Admin - Configurações"])


@router.get("/configuracoes")
async def listar_secoes(
    current_user: Usuario = Depends(check_permissao("configuracoes", "ver")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("configuracoes", current_user.empresa_id, db)

    secoes = await configuracao_service.listar_secoes(db, current_user.empresa_id)
    return {"data": secoes}


@router.get("/configuracoes/{secao}")
async def obter_secao(
    secao: str,
    current_user: Usuario = Depends(check_permissao("configuracoes", "ver")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("configuracoes", current_user.empresa_id, db)

    valores = await configuracao_service.obter_secao(db, current_user.empresa_id, secao)
    return {"data": ConfiguracaoSecaoResponse(secao=secao, valores=valores).model_dump()}


@router.put("/configuracoes/{secao}")
async def atualizar_secao(
    secao: str,
    data: ConfiguracaoUpdateRequest,
    current_user: Usuario = Depends(check_permissao("configuracoes", "editar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("configuracoes", current_user.empresa_id, db)

    valores = await configuracao_service.atualizar_secao(db, current_user.empresa_id, secao, data.valores)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "editar", "configuracoes")
    await db.commit()
    return {"data": ConfiguracaoSecaoResponse(secao=secao, valores=valores).model_dump()}


@router.post("/configuracoes/{secao}/nova-chave", status_code=201)
async def adicionar_chave(
    secao: str,
    data: ConfiguracaoNovaChaveRequest,
    current_user: Usuario = Depends(check_permissao("configuracoes", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("configuracoes", current_user.empresa_id, db)

    await configuracao_service.adicionar_chave(
        db, current_user.empresa_id, secao, data.chave, data.valor, data.tipo
    )
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "configuracoes")
    await db.commit()
    return {"data": {"mensagem": f"Chave '{data.chave}' adicionada à seção '{secao}'"}}
