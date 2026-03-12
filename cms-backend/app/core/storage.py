import boto3
from botocore.config import Config as BotoConfig

from app.core.config import settings
from app.core.security import descriptografar


def criar_r2_client(
    access_key_encrypted: str,
    secret_key_encrypted: str,
):
    """Cria um client S3 (R2-compatible) com as credenciais descriptografadas da empresa."""
    access_key = descriptografar(access_key_encrypted)
    secret_key = descriptografar(secret_key_encrypted)

    endpoint_url = f"https://{settings.CF_ACCOUNT_ID}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=BotoConfig(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        region_name="auto",
    )
