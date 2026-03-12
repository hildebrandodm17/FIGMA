import bleach

TAGS_PERMITIDAS = [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "u", "s", "mark",
    "ul", "ol", "li",
    "blockquote", "code", "pre",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "sup", "sub", "span", "div",
]

ATRIBUTOS_PERMITIDOS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
    "*": ["class", "style"],
}


def sanitizar_html(html: str) -> str:
    """Remove tags e atributos não permitidos do HTML gerado pelo TipTap."""
    return bleach.clean(
        html,
        tags=TAGS_PERMITIDAS,
        attributes=ATRIBUTOS_PERMITIDOS,
        strip=True,
    )
