from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import config_cache, invalidar_cache_empresa
from app.models.configuracao import Configuracao, Tema


async def listar_secoes(
    db: AsyncSession,
    empresa_id: UUID,
) -> dict[str, dict[str, str | None]]:
    """Retorna todas as configurações agrupadas por seção."""
    cache_key = f"{empresa_id}:all"
    cached = config_cache.get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(Configuracao).where(Configuracao.empresa_id == empresa_id)
    )
    configs = result.scalars().all()

    secoes: dict[str, dict[str, str | None]] = {}
    for cfg in configs:
        if cfg.secao not in secoes:
            secoes[cfg.secao] = {}
        secoes[cfg.secao][cfg.chave] = cfg.valor

    config_cache[cache_key] = secoes
    return secoes


async def obter_secao(
    db: AsyncSession,
    empresa_id: UUID,
    secao: str,
) -> dict[str, str | None]:
    """Retorna as chaves/valores de uma seção."""
    cache_key = f"{empresa_id}:{secao}"
    cached = config_cache.get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(Configuracao).where(
            Configuracao.empresa_id == empresa_id,
            Configuracao.secao == secao,
        )
    )
    configs = result.scalars().all()

    valores = {cfg.chave: cfg.valor for cfg in configs}
    config_cache[cache_key] = valores
    return valores


async def atualizar_secao(
    db: AsyncSession,
    empresa_id: UUID,
    secao: str,
    valores: dict[str, str | None],
) -> dict[str, str | None]:
    """Atualiza valores de uma seção. Cria chaves se não existirem."""
    for chave, valor in valores.items():
        result = await db.execute(
            select(Configuracao).where(
                Configuracao.empresa_id == empresa_id,
                Configuracao.secao == secao,
                Configuracao.chave == chave,
            )
        )
        cfg = result.scalar_one_or_none()

        if cfg:
            cfg.valor = valor
        else:
            db.add(Configuracao(
                empresa_id=empresa_id,
                secao=secao,
                chave=chave,
                valor=valor,
            ))

    invalidar_cache_empresa(str(empresa_id))
    await db.commit()

    return await obter_secao(db, empresa_id, secao)


async def adicionar_chave(
    db: AsyncSession,
    empresa_id: UUID,
    secao: str,
    chave: str,
    valor: str | None,
    tipo: str = "texto",
) -> None:
    """Adiciona nova chave customizada a uma seção."""
    result = await db.execute(
        select(Configuracao).where(
            Configuracao.empresa_id == empresa_id,
            Configuracao.secao == secao,
            Configuracao.chave == chave,
        )
    )
    if result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(409, detail={"codigo": "CONFLITO_SLUG", "mensagem": "Chave já existe nesta seção"})

    db.add(Configuracao(
        empresa_id=empresa_id,
        secao=secao,
        chave=chave,
        valor=valor,
        tipo=tipo,
    ))
    invalidar_cache_empresa(str(empresa_id))
    await db.commit()


async def obter_tema(db: AsyncSession, empresa_id: UUID) -> Tema | None:
    result = await db.execute(
        select(Tema).where(Tema.empresa_id == empresa_id, Tema.ativo == True)
    )
    return result.scalar_one_or_none()


async def atualizar_tema(
    db: AsyncSession,
    empresa_id: UUID,
    dados: dict,
) -> Tema:
    tema = await obter_tema(db, empresa_id)
    if not tema:
        tema = Tema(empresa_id=empresa_id)
        db.add(tema)

    for campo, valor in dados.items():
        if valor is not None:
            setattr(tema, campo, valor)

    invalidar_cache_empresa(str(empresa_id))
    await db.commit()
    await db.refresh(tema)
    return tema
