from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import check_permissao, verificar_modulo_ativo
from app.middleware.audit import registrar_audit
from app.middleware.rate_limit import limiter
from app.models.arquivo import Arquivo
from app.models.usuario import Usuario
from app.schemas.arquivo import ArquivoResponse
from app.services import storage_service
from app.utils.pagination import paginar

router = APIRouter(tags=["Admin - Arquivos"])


@router.post("/arquivos/upload", status_code=201)
@limiter.limit("20/hour")
async def upload(
    request: Request,
    arquivo: UploadFile = File(...),
    current_user: Usuario = Depends(check_permissao("arquivos", "criar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("arquivos", current_user.empresa_id, db)

    resultado = await storage_service.upload_arquivo(db, current_user.empresa_id, arquivo)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "criar", "arquivos", resultado.id)
    await db.commit()
    return {"data": ArquivoResponse.model_validate(resultado).model_dump()}


@router.get("/arquivos")
async def listar(
    current_user: Usuario = Depends(check_permissao("arquivos", "ver")),
    db: AsyncSession = Depends(get_db),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    tipo: str | None = None,
):
    await verificar_modulo_ativo("arquivos", current_user.empresa_id, db)

    query = select(Arquivo).where(
        Arquivo.empresa_id == current_user.empresa_id,
        Arquivo.deletado_em.is_(None),
    ).order_by(Arquivo.created_at.desc())

    if tipo is not None:
        query = query.where(Arquivo.tipo == tipo)

    items, meta = await paginar(db, query, pagina, limite)
    data = [ArquivoResponse.model_validate(a).model_dump() for a in items]
    return {"data": data, "meta": meta.model_dump()}


@router.delete("/arquivos/{id}", status_code=204)
async def deletar(
    id: UUID,
    current_user: Usuario = Depends(check_permissao("arquivos", "deletar")),
    db: AsyncSession = Depends(get_db),
):
    await verificar_modulo_ativo("arquivos", current_user.empresa_id, db)

    await storage_service.deletar_arquivo(db, current_user.empresa_id, id)
    await registrar_audit(db, current_user.id, current_user.empresa_id, "deletar", "arquivos", id)
    await db.commit()
