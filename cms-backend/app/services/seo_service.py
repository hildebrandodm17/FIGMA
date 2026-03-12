from uuid import UUID
from xml.etree.ElementTree import Element, SubElement, tostring

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conteudo import Post
from app.models.empresa import Empresa
from app.models.item import Item


async def gerar_sitemap(
    db: AsyncSession,
    empresa: Empresa,
) -> str:
    """Gera sitemap.xml dinâmico com posts publicados e itens ativos."""
    base_url = f"https://{empresa.dominio}" if empresa.dominio else f"https://{empresa.slug}.exemplo.com"

    urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    # Página principal
    url_el = SubElement(urlset, "url")
    SubElement(url_el, "loc").text = f"{base_url}/"
    SubElement(url_el, "changefreq").text = "monthly"
    SubElement(url_el, "priority").text = "1.0"

    # Posts publicados
    result = await db.execute(
        select(Post).where(
            Post.empresa_id == empresa.id,
            Post.publicado == True,
            Post.deletado_em.is_(None),
            Post.indexavel == True,
        ).order_by(Post.publicado_em.desc())
    )
    posts = result.scalars().all()

    for post in posts:
        url_el = SubElement(urlset, "url")
        SubElement(url_el, "loc").text = f"{base_url}/blog/{post.slug}"
        if post.publicado_em:
            SubElement(url_el, "lastmod").text = post.publicado_em.strftime("%Y-%m-%d")
        SubElement(url_el, "changefreq").text = "monthly"
        SubElement(url_el, "priority").text = "0.8"

    # Itens ativos
    result = await db.execute(
        select(Item).where(
            Item.empresa_id == empresa.id,
            Item.ativo == True,
            Item.deletado_em.is_(None),
        ).order_by(Item.ordem)
    )
    itens = result.scalars().all()

    for item in itens:
        url_el = SubElement(urlset, "url")
        SubElement(url_el, "loc").text = f"{base_url}/produtos/{item.slug}"
        SubElement(url_el, "changefreq").text = "monthly"
        SubElement(url_el, "priority").text = "0.7"

    xml_bytes = tostring(urlset, encoding="unicode", xml_declaration=False)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n{xml_bytes}'


def gerar_robots(empresa: Empresa) -> str:
    """Gera robots.txt apontando para o sitemap."""
    base_url = f"https://{empresa.dominio}" if empresa.dominio else f"https://{empresa.slug}.exemplo.com"
    return f"User-agent: *\nAllow: /\nSitemap: {base_url}/api/v1/site/sitemap.xml\n"
