from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class UsuarioToken(BaseModel):
    id: str
    nome: str
    email: str
    role: str
    empresa_id: str | None = None
    empresa_nome: str | None = None
    permissoes: dict = {}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expira_em: int
    usuario: UsuarioToken
