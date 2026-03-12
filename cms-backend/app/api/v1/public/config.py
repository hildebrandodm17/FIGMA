from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_empresa_from_slug
from app.middleware.rate_limit import limiter
from app.core.config import settings
from app.models.empresa import Empresa
from app.services import configuracao_service, seo_service

router = APIRouter(tags=["Site - Config"])


@router.get("/config")
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def site_config(
    request: Request,
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    from app.models.empresa_modulo import EmpresaModulo
    from app.models.contato import Contato
    from sqlalchemy import select

    # Configurações
    configuracoes = await configuracao_service.listar_secoes(db, empresa.id)

    # Módulos ativos
    result = await db.execute(
        select(EmpresaModulo).where(
            EmpresaModulo.empresa_id == empresa.id,
            EmpresaModulo.ativo == True,
        )
    )
    modulos = [m.modulo for m in result.scalars().all()]

    # Tema
    tema = await configuracao_service.obter_tema(db, empresa.id)

    # Contato
    result = await db.execute(
        select(Contato).where(Contato.empresa_id == empresa.id)
    )
    contato = result.scalar_one_or_none()

    tema_dict = None
    if tema:
        tema_dict = {
            "cor_primaria": tema.cor_primaria,
            "cor_secundaria": tema.cor_secundaria,
            "cor_destaque": tema.cor_destaque,
            "cor_texto": tema.cor_texto,
            "cor_fundo": tema.cor_fundo,
            "cor_header": tema.cor_header,
            "cor_footer": tema.cor_footer,
            "fonte_principal": tema.fonte_principal,
            "fonte_titulo": tema.fonte_titulo,
        }

    contato_dict = None
    if contato:
        contato_dict = {
            "telefone": contato.telefone,
            "telefone_2": contato.telefone_2,
            "email": contato.email,
            "whatsapp": contato.whatsapp,
            "whatsapp_hover": contato.whatsapp_hover,
            "endereco": contato.endereco,
            "cidade": contato.cidade,
            "estado": contato.estado,
            "cep": contato.cep,
            "mapa_embed": contato.mapa_embed,
            "facebook": contato.facebook,
            "instagram": contato.instagram,
            "linkedin": contato.linkedin,
            "youtube": contato.youtube,
            "tiktok": contato.tiktok,
        }

    return {
        "data": {
            "empresa": {"nome": empresa.nome, "slug": empresa.slug},
            "modulos_ativos": modulos,
            "configuracoes": configuracoes,
            "tema": tema_dict,
            "contato": contato_dict,
        }
    }


@router.get("/sitemap.xml")
async def sitemap(
    empresa: Empresa = Depends(get_empresa_from_slug),
    db: AsyncSession = Depends(get_db),
):
    xml = await seo_service.gerar_sitemap(db, empresa)
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def robots(
    empresa: Empresa = Depends(get_empresa_from_slug),
):
    txt = seo_service.gerar_robots(empresa)
    return PlainTextResponse(content=txt)
