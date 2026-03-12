import pytest
from httpx import AsyncClient

from app.core.security import criar_access_token
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_criar_lead_publico(client: AsyncClient, empresa: Empresa):
    response = await client.post(
        "/api/v1/site/leads",
        json={
            "nome": "João Teste",
            "email": "joao@teste.com",
            "telefone": "11999999999",
            "mensagem": "Quero um orçamento",
            "origem": "/contato",
            "lgpd_aceito": True,
        },
        headers={"X-Empresa-Slug": empresa.slug},
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert "id" in data


@pytest.mark.asyncio
async def test_criar_lead_sem_lgpd(client: AsyncClient, empresa: Empresa):
    response = await client.post(
        "/api/v1/site/leads",
        json={
            "nome": "João Teste",
            "email": "joao@teste.com",
            "lgpd_aceito": False,
        },
        headers={"X-Empresa-Slug": empresa.slug},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_listar_leads_admin(client: AsyncClient, empresa: Empresa, admin: Usuario):
    # Criar lead primeiro
    await client.post(
        "/api/v1/site/leads",
        json={
            "nome": "Lead Teste",
            "email": "lead@teste.com",
            "lgpd_aceito": True,
        },
        headers={"X-Empresa-Slug": empresa.slug},
    )

    # Listar como admin
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)
    response = await client.get(
        "/api/v1/admin/leads",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_empresa_slug_invalido(client: AsyncClient):
    response = await client.post(
        "/api/v1/site/leads",
        json={
            "nome": "Teste",
            "email": "t@t.com",
            "lgpd_aceito": True,
        },
        headers={"X-Empresa-Slug": "slug-inexistente"},
    )
    assert response.status_code == 404
