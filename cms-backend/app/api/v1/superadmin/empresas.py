from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.security import criar_access_token
from app.middleware.audit import registrar_audit
from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate
from app.services import empresa_service

router = APIRouter(tags=["SuperAdmin - Empresas"])


@router.get("/empresas")
async def listar(
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    busca: str | None = None,
    ativo: bool | None = None,
):
    items, meta = await empresa_service.listar_empresas(db, pagina, limite, busca, ativo)
    data = [EmpresaResponse.model_validate(e).model_dump() for e in items]
    return {"data": data, "meta": meta.model_dump() if hasattr(meta, 'model_dump') else meta}


@router.post("/empresas", status_code=201)
async def criar(
    data: EmpresaCreate,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    empresa = await empresa_service.criar_empresa(
        db,
        nome=data.nome,
        slug=data.slug,
        dominio=data.dominio,
        plano=data.plano,
        admin_nome=data.admin_nome,
        admin_email=data.admin_email,
        admin_senha=data.admin_senha,
    )
    await registrar_audit(db, current_user.id, empresa.id, "criar", "empresas", empresa.id)
    await db.commit()
    return {"data": EmpresaResponse.model_validate(empresa).model_dump()}


@router.get("/empresas/{id}")
async def obter(
    id: UUID,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    empresa = await empresa_service.obter_empresa(db, id)
    return {"data": EmpresaResponse.model_validate(empresa).model_dump()}


@router.put("/empresas/{id}")
async def atualizar(
    id: UUID,
    data: EmpresaUpdate,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    empresa = await empresa_service.atualizar_empresa(db, id, data.model_dump(exclude_unset=True))
    await registrar_audit(db, current_user.id, empresa.id, "editar", "empresas", id)
    await db.commit()
    return {"data": EmpresaResponse.model_validate(empresa).model_dump()}


@router.delete("/empresas/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    empresa = await empresa_service.obter_empresa(db, id)
    empresa.deletado_em = datetime.now(timezone.utc)
    empresa.ativo = False
    await registrar_audit(db, current_user.id, id, "deletar", "empresas", id)
    await db.commit()


@router.post("/empresas/{id}/suspender")
async def suspender(
    id: UUID,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    empresa = await empresa_service.suspender_empresa(db, id)
    await registrar_audit(db, current_user.id, id, "editar", "empresas", id, dados_depois={"ativo": False})
    await db.commit()
    return {"data": EmpresaResponse.model_validate(empresa).model_dump()}


@router.post("/empresas/{id}/ativar")
async def ativar(
    id: UUID,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    empresa = await empresa_service.ativar_empresa(db, id)
    await registrar_audit(db, current_user.id, id, "editar", "empresas", id, dados_depois={"ativo": True})
    await db.commit()
    return {"data": EmpresaResponse.model_validate(empresa).model_dump()}


@router.post("/impersonar/{empresa_id}")
async def impersonar(
    empresa_id: UUID,
    current_user: Usuario = Depends(require_role("superadmin")),
    db: AsyncSession = Depends(get_db),
):
    """Retorna access token com permissões de admin da empresa selecionada."""
    empresa = await empresa_service.obter_empresa(db, empresa_id)

    access_token = criar_access_token(
        sub=str(current_user.id),
        empresa_id=str(empresa_id),
        role="admin",
        permissoes={"impersonado": True},
    )

    await registrar_audit(db, current_user.id, empresa_id, "impersonar", "empresas", empresa_id)
    await db.commit()

    return {
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "empresa": {
                "id": str(empresa.id),
                "nome": empresa.nome,
                "slug": empresa.slug,
            },
            "impersonado": True,
        }
    }
