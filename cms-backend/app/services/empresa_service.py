from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidar_cache_empresa
from app.core.security import hash_senha
from app.models.configuracao import Configuracao, Tema
from app.models.contato import Contato
from app.models.empresa import Empresa
from app.models.empresa_modulo import MODULOS_PADRAO, EmpresaModulo
from app.models.usuario import Usuario

# Configurações padrão criadas ao cadastrar empresa
CONFIGURACOES_PADRAO: dict[str, list[tuple[str, str]]] = {
    "frontend": [("titulo", "texto"), ("texto", "texto"), ("logo", "imagem"), ("logo_negativo", "imagem")],
    "menu": [(f"item_{str(i).zfill(2)}", "texto") for i in range(1, 11)],
    "pagina-sobre": [("cabecalho", "texto"), ("subtitulo", "texto"), ("titulo", "texto"), ("texto", "rich_text")],
    "pagina-blog": [("cabecalho", "texto"), ("subtitulo", "texto"), ("titulo", "texto")],
    "pagina-contato": [("cabecalho", "texto"), ("subtitulo", "texto"), ("titulo", "texto"), ("texto", "rich_text"), ("mapa_embed", "texto")],
    "pagina-produtos": [("cabecalho", "texto"), ("subtitulo", "texto"), ("titulo", "texto"), ("texto", "rich_text")],
    "pagina-404": [("titulo", "texto"), ("subtitulo", "texto"), ("texto", "texto")],
    "pagina-lgpd": [("titulo", "texto"), ("conteudo", "rich_text")],
    "redes-sociais": [("facebook", "url"), ("instagram", "url"), ("linkedin", "url"), ("youtube", "url"), ("tiktok", "url"), ("whatsapp", "texto"), ("whatsapp_hover", "texto")],
    "lgpd": [("footer_texto", "texto")],
    "breadcrumb": [("background", "imagem")],
    "secao-banner": [("subtitulo_01", "texto"), ("subtitulo_02", "texto"), ("titulo", "texto"), ("texto", "texto"), ("label", "texto"), ("background", "imagem")],
    "secao-banner-02": [("linha_01", "texto"), ("linha_02", "texto"), ("label", "texto"), ("background", "imagem")],
    "seo": [("google_analytics", "texto"), ("google_tag_manager", "texto"), ("pixel_facebook", "texto")],
}


async def criar_empresa(
    db: AsyncSession,
    nome: str,
    slug: str,
    dominio: str | None,
    plano: str,
    admin_nome: str,
    admin_email: str,
    admin_senha: str,
) -> Empresa:
    """Cria empresa com provisão completa: contato, tema, módulos, configs e admin."""
    # Verificar slug único
    result = await db.execute(select(Empresa).where(Empresa.slug == slug))
    if result.scalar_one_or_none():
        raise HTTPException(409, detail={"codigo": "CONFLITO_SLUG", "mensagem": "Slug já existe"})

    # Verificar email único
    result = await db.execute(select(Usuario).where(Usuario.email == admin_email))
    if result.scalar_one_or_none():
        raise HTTPException(409, detail={"codigo": "CONFLITO_SLUG", "mensagem": "E-mail do admin já cadastrado"})

    # 1. Empresa
    empresa = Empresa(nome=nome, slug=slug, dominio=dominio, plano=plano)
    db.add(empresa)
    await db.flush()

    # 2. Contato vazio
    contato = Contato(empresa_id=empresa.id)
    db.add(contato)

    # 3. Tema padrão
    tema = Tema(empresa_id=empresa.id)
    db.add(tema)

    # 4. Módulos padrão (todos ativos)
    for modulo in MODULOS_PADRAO:
        db.add(EmpresaModulo(empresa_id=empresa.id, modulo=modulo, ativo=True))

    # 5. Configurações padrão
    for secao, chaves in CONFIGURACOES_PADRAO.items():
        for chave, tipo in chaves:
            db.add(Configuracao(
                empresa_id=empresa.id,
                secao=secao,
                chave=chave,
                valor=None,
                tipo=tipo,
            ))

    # 6. Usuário Admin
    admin = Usuario(
        empresa_id=empresa.id,
        nome=admin_nome,
        email=admin_email,
        senha_hash=hash_senha(admin_senha),
        role="admin",
    )
    db.add(admin)

    await db.commit()
    await db.refresh(empresa)
    return empresa


async def listar_empresas(
    db: AsyncSession,
    pagina: int = 1,
    limite: int = 20,
    busca: str | None = None,
    ativo: bool | None = None,
) -> tuple[list[Empresa], int]:
    """Lista empresas paginadas."""
    from app.utils.pagination import paginar
    from app.schemas.base import PaginationMeta

    query = select(Empresa).where(Empresa.deletado_em.is_(None))

    if busca:
        query = query.where(Empresa.nome.ilike(f"%{busca}%"))
    if ativo is not None:
        query = query.where(Empresa.ativo == ativo)

    query = query.order_by(Empresa.created_at.desc())
    items, meta = await paginar(db, query, pagina, limite)
    return items, meta


async def obter_empresa(db: AsyncSession, empresa_id: UUID) -> Empresa:
    result = await db.execute(
        select(Empresa).where(Empresa.id == empresa_id, Empresa.deletado_em.is_(None))
    )
    empresa = result.scalar_one_or_none()
    if not empresa:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Empresa não encontrada"})
    return empresa


async def atualizar_empresa(db: AsyncSession, empresa_id: UUID, dados: dict) -> Empresa:
    empresa = await obter_empresa(db, empresa_id)

    from app.core.security import criptografar

    for campo, valor in dados.items():
        if valor is not None:
            # Criptografar credenciais R2
            if campo in ("r2_access_key", "r2_secret_key") and valor:
                valor = criptografar(valor)
            setattr(empresa, campo, valor)

    invalidar_cache_empresa(str(empresa_id))
    await db.commit()
    await db.refresh(empresa)
    return empresa


async def suspender_empresa(db: AsyncSession, empresa_id: UUID) -> Empresa:
    empresa = await obter_empresa(db, empresa_id)
    empresa.ativo = False
    invalidar_cache_empresa(str(empresa_id))
    await db.commit()
    await db.refresh(empresa)
    return empresa


async def ativar_empresa(db: AsyncSession, empresa_id: UUID) -> Empresa:
    empresa = await obter_empresa(db, empresa_id)
    empresa.ativo = True
    invalidar_cache_empresa(str(empresa_id))
    await db.commit()
    await db.refresh(empresa)
    return empresa


async def listar_dominios_ativos(db: AsyncSession) -> list[Empresa]:
    result = await db.execute(
        select(Empresa).where(
            Empresa.ativo == True,
            Empresa.deletado_em.is_(None),
            Empresa.dominio.isnot(None),
        )
    )
    return list(result.scalars().all())
