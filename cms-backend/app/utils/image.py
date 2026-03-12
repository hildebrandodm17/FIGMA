import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",
    b"%PDF": "application/pdf",
    b"<svg": "image/svg+xml",
}

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".svg"}
TAMANHO_MAXIMO = 10 * 1024 * 1024  # 10MB
MAX_DIM = 2000


async def validar_arquivo(arquivo: UploadFile) -> tuple[bytes, str]:
    """Valida tamanho, extensão e magic bytes. Retorna (conteudo, mime_type)."""
    conteudo = await arquivo.read()
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(422, "Arquivo excede 10MB")

    ext = Path(arquivo.filename or "").suffix.lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise HTTPException(422, f"Extensão {ext} não permitida")

    primeiros_bytes = conteudo[:8]
    tipo_real = None
    for magic, mime in MAGIC_BYTES.items():
        if primeiros_bytes.startswith(magic):
            tipo_real = mime
            break

    if not tipo_real:
        raise HTTPException(422, "Tipo de arquivo não identificado ou não permitido")

    return conteudo, tipo_real


def processar_imagem(conteudo: bytes) -> tuple[bytes, int, int]:
    """Redimensiona e converte para WebP. Retorna (bytes_webp, largura, altura)."""
    imagem = Image.open(BytesIO(conteudo))

    if imagem.mode in ("RGBA", "P"):
        imagem = imagem.convert("RGB")

    if imagem.width > MAX_DIM or imagem.height > MAX_DIM:
        imagem.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    output = BytesIO()
    imagem.save(output, format="WebP", quality=85, optimize=True)
    return output.getvalue(), imagem.width, imagem.height


def gerar_nome_arquivo(extensao_original: str) -> str:
    if extensao_original.lower() in (".pdf", ".svg"):
        return f"{uuid.uuid4()}{extensao_original.lower()}"
    return f"{uuid.uuid4()}.webp"


def classificar_tipo(mime_type: str) -> str:
    if mime_type.startswith("image/"):
        return "image"
    if mime_type == "application/pdf":
        return "document"
    return "document"
