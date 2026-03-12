from cachetools import TTLCache

# Cache de configurações por empresa (TTL 5 minutos)
config_cache: TTLCache = TTLCache(maxsize=500, ttl=300)

# Cache de empresas por slug (TTL 5 minutos)
empresa_cache: TTLCache = TTLCache(maxsize=200, ttl=300)

# Cache de módulos ativos por empresa (TTL 5 minutos)
modulos_cache: TTLCache = TTLCache(maxsize=200, ttl=300)

# Cache de domínios ativos para CORS (TTL 5 minutos)
dominios_cache: TTLCache = TTLCache(maxsize=1, ttl=300)


def invalidar_cache_empresa(empresa_id: str) -> None:
    """Invalida todos os caches relacionados a uma empresa."""
    chaves_config = [k for k in config_cache if k.startswith(empresa_id)]
    for k in chaves_config:
        config_cache.pop(k, None)

    empresa_cache.pop(empresa_id, None)

    chaves_slug = [k for k in empresa_cache if isinstance(k, str)]
    for k in chaves_slug:
        cached = empresa_cache.get(k)
        if cached and str(getattr(cached, "id", "")) == empresa_id:
            empresa_cache.pop(k, None)

    modulos_cache.pop(empresa_id, None)
    dominios_cache.clear()
