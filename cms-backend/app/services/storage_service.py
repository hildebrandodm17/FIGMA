from io import BytesIO
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import criar_r2_client
from app.models.arquivo import Arquivo
from app.models.empresa import Empresa
from app.utils.image import (
    classificar_tipo,
    gerar_nome_arquivo,
    processar_imagem,
    validar_arquivo,
)


async def upload_arquivo(
    db: AsyncSession,
    empresa_id: UUID,
    arquivo: UploadFile,
) -> Arquivo:
    """Valida, processa e envia arquivo para o R2."""
    # Buscar empresa com credenciais R2
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = result.scalar_one_or_none()

    if not empresa or not empresa.r2_bucket_name or not empresa.r2_access_key:
        raise HTTPException(400, detail={"codigo": "ERRO_INTERNO", "mensagem": "Configurações de armazenamento não encontradas"})

    # Validar arquivo
    conteudo, mime_type = await validar_arquivo(arquivo)

    ext = Path(arquivo.filename or "").suffix.lower()
    nome_arquivo = gerar_nome_arquivo(ext)
    tipo = classificar_tipo(mime_type)

    largura = None
    altura = None

    # Processar imagem (não processa PDF e SVG)
    if mime_type.startswith("image/") and mime_type not in ("image/svg+xml",):
        conteudo, largura, altura = processar_imagem(conteudo)
        nome_arquivo = nome_arquivo.replace(ext, ".webp") if not nome_arquivo.endswith(".webp") else nome_arquivo

    # Upload para R2
    r2_client = criar_r2_client(empresa.r2_access_key, empresa.r2_secret_key)
    r2_client.put_object(
        Bucket=empresa.r2_bucket_name,
        Key=nome_arquivo,
        Body=BytesIO(conteudo),
        ContentType=mime_type if not nome_arquivo.endswith(".webp") else "image/webp",
    )

    url = f"{empresa.r2_public_url}/{nome_arquivo}" if empresa.r2_public_url else nome_arquivo

    # Salvar metadados
    arquivo_db = Arquivo(
        empresa_id=empresa_id,
        nome_original=arquivo.filename,
        nome_arquivo=nome_arquivo,
        url=url,
        tipo=tipo,
        mime_type=mime_type,
        tamanho_bytes=len(conteudo),
        largura=largura,
        altura=altura,
    )
    db.add(arquivo_db)
    await db.commit()
    await db.refresh(arquivo_db)

    return arquivo_db


async def deletar_arquivo(
    db: AsyncSession,
    empresa_id: UUID,
    arquivo_id: UUID,
) -> None:
    """Soft delete do arquivo e remove do R2."""
    from datetime import datetime, timezone

    result = await db.execute(
        select(Arquivo).where(
            Arquivo.id == arquivo_id,
            Arquivo.empresa_id == empresa_id,
            Arquivo.deletado_em.is_(None),
        )
    )
    arquivo = result.scalar_one_or_none()

    if not arquivo:
        raise HTTPException(404, detail={"codigo": "NAO_ENCONTRADO", "mensagem": "Arquivo não encontrado"})

    # Tentar remover do R2
    empresa_result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    empresa = empresa_result.scalar_one_or_none()

    if empresa and empresa.r2_bucket_name and empresa.r2_access_key:
        try:
            r2_client = criar_r2_client(empresa.r2_access_key, empresa.r2_secret_key)
            r2_client.delete_object(
                Bucket=empresa.r2_bucket_name,
                Key=arquivo.nome_arquivo,
            )
        except Exception:
            pass  # Continua com soft delete mesmo se falhar no R2

    arquivo.deletado_em = datetime.now(timezone.utc)
    await db.commit()
