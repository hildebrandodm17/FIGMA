from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidar_cache_empresa
from app.core.database import get_db
from app.core.dependencies import require_role
from app.middleware.audit import registrar_audit
from app.models.empresa_modulo import EmpresaModulo
from app.models.usuario import Usuario

router = APIRouter(tags=["Admin - Módulos"])


@router.get("/modulos")
async def listar(
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmpresaModulo).where(
            EmpresaModulo.empresa_id == current_user.empresa_id,
        ).order_by(EmpresaModulo.modulo)
    )
    modulos = result.scalars().all()
    data = [
        {"id": str(m.id), "modulo": m.modulo, "ativo": m.ativo}
        for m in modulos
    ]
    return {"data": data}


@router.patch("/modulos/{modulo}")
async def toggle(
    modulo: str,
    current_user: Usuario = Depends(require_role("admin", "superadmin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmpresaModulo).where(
            EmpresaModulo.empresa_id == current_user.empresa_id,
            EmpresaModulo.modulo == modulo,
        )
    )
    empresa_modulo = result.scalar_one_or_none()
    if not empresa_modulo:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": f"Módulo '{modulo}' não encontrado"})

    empresa_modulo.ativo = not empresa_modulo.ativo
    invalidar_cache_empresa(str(current_user.empresa_id))
    await registrar_audit(
        db, current_user.id, current_user.empresa_id,
        "editar", "modulos", empresa_modulo.id,
    )
    await db.commit()
    return {"data": {"modulo": modulo, "ativo": empresa_modulo.ativo}}
