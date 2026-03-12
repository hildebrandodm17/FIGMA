import pytest

from app.utils.image import (
    EXTENSOES_PERMITIDAS,
    MAGIC_BYTES,
    classificar_tipo,
    gerar_nome_arquivo,
)


def test_extensoes_permitidas():
    assert ".jpg" in EXTENSOES_PERMITIDAS
    assert ".png" in EXTENSOES_PERMITIDAS
    assert ".webp" in EXTENSOES_PERMITIDAS
    assert ".pdf" in EXTENSOES_PERMITIDAS
    assert ".svg" in EXTENSOES_PERMITIDAS
    assert ".exe" not in EXTENSOES_PERMITIDAS
    assert ".js" not in EXTENSOES_PERMITIDAS


def test_magic_bytes():
    assert MAGIC_BYTES[b"\xff\xd8\xff"] == "image/jpeg"
    assert MAGIC_BYTES[b"\x89PNG\r\n\x1a\n"] == "image/png"
    assert MAGIC_BYTES[b"%PDF"] == "application/pdf"


def test_gerar_nome_arquivo_imagem():
    nome = gerar_nome_arquivo(".jpg")
    assert nome.endswith(".webp")
    assert len(nome) > 10


def test_gerar_nome_arquivo_pdf():
    nome = gerar_nome_arquivo(".pdf")
    assert nome.endswith(".pdf")


def test_gerar_nome_arquivo_svg():
    nome = gerar_nome_arquivo(".svg")
    assert nome.endswith(".svg")


def test_classificar_tipo():
    assert classificar_tipo("image/jpeg") == "image"
    assert classificar_tipo("image/png") == "image"
    assert classificar_tipo("application/pdf") == "document"
