import pytest
from httpx import AsyncClient

from app.models.usuario import Usuario


@pytest.mark.asyncio
async def test_login_sucesso(client: AsyncClient, admin: Usuario):
    response = await client.post("/api/v1/auth/login", json={
        "email": "admin@teste.com",
        "senha": "senha123",
    })
    assert response.status_code == 200
    data = response.json()["data"]
    assert "access_token" in data
    assert data["usuario"]["email"] == "admin@teste.com"
    assert data["usuario"]["role"] == "admin"
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_senha_errada(client: AsyncClient, admin: Usuario):
    response = await client.post("/api/v1/auth/login", json={
        "email": "admin@teste.com",
        "senha": "errada",
    })
    assert response.status_code == 401
    assert response.json()["detail"]["codigo"] == "NAO_AUTENTICADO"


@pytest.mark.asyncio
async def test_login_email_inexistente(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nao@existe.com",
        "senha": "qualquer",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, admin: Usuario):
    # Login primeiro
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@teste.com",
        "senha": "senha123",
    })
    assert login.status_code == 200

    # Refresh usando cookie
    refresh = await client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    data = refresh.json()["data"]
    assert "access_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin: Usuario):
    # Login
    await client.post("/api/v1/auth/login", json={
        "email": "admin@teste.com",
        "senha": "senha123",
    })

    # Logout
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 204
