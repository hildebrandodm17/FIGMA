from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.middleware.rate_limit import limiter
from app.schemas.auth import LoginRequest
from app.schemas.base import SingleResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    token_response, refresh_token_raw = await auth_service.login(
        db, data.email, data.senha, ip=ip, user_agent=user_agent
    )

    # Setar refresh token como cookie httpOnly
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_raw,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="strict",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )

    return SingleResponse(data=token_response)


@router.post("/refresh")
@limiter.limit("20/hour")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token_raw = request.cookies.get("refresh_token")
    if not refresh_token_raw:
        from fastapi import HTTPException
        raise HTTPException(401, detail={"codigo": "NAO_AUTENTICADO", "mensagem": "Refresh token não encontrado"})

    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    token_response, new_refresh_raw = await auth_service.refresh(
        db, refresh_token_raw, ip=ip, user_agent=user_agent
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_raw,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="strict",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )

    return SingleResponse(data=token_response)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token_raw = request.cookies.get("refresh_token")
    if refresh_token_raw:
        await auth_service.logout(db, refresh_token_raw)

    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
