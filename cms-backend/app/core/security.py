import hashlib
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Bcrypt ---

def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha, senha_hash)


# --- JWT ---

def criar_access_token(
    sub: str,
    empresa_id: str | None,
    role: str,
    permissoes: dict | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "empresa_id": empresa_id,
        "role": role,
        "permissoes": permissoes or {},
        "tipo": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def criar_refresh_token(sub: str) -> tuple[str, str]:
    """Retorna (token_jwt, jti) para salvar o hash do jti no banco."""
    now = datetime.now(timezone.utc)
    jti = str(uuid4())
    payload = {
        "sub": sub,
        "tipo": "refresh",
        "jti": jti,
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti


def verificar_token(token: str, tipo_esperado: str = "access") -> dict:
    """Decodifica e valida um token JWT. Levanta JWTError se inválido."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise

    if payload.get("tipo") != tipo_esperado:
        raise JWTError(f"Tipo de token inválido: esperado {tipo_esperado}")

    return payload


def hash_token(token: str) -> str:
    """SHA-256 para armazenar refresh tokens no banco."""
    return hashlib.sha256(token.encode()).hexdigest()


# --- Fernet (criptografia de credenciais R2) ---

def _get_fernet() -> Fernet:
    return Fernet(settings.FERNET_KEY.encode())


def criptografar(valor: str) -> str:
    return _get_fernet().encrypt(valor.encode()).decode()


def descriptografar(valor_criptografado: str) -> str:
    return _get_fernet().decrypt(valor_criptografado.encode()).decode()
