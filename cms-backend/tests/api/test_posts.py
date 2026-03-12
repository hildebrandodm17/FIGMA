import pytest
from httpx import AsyncClient

from app.core.security import criar_access_token
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_criar_post(client: AsyncClient, empresa: Empresa, admin: Usuario):
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)
    response = await client.post(
        "/api/v1/admin/posts",
        json={
            "titulo": "Meu Primeiro Post",
            "tipo": "post",
            "resumo": "Resumo do post",
            "publicado": False,
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["titulo"] == "Meu Primeiro Post"
    assert data["slug"] == "meu-primeiro-post"
    assert data["versao"] == 1


@pytest.mark.asyncio
async def test_listar_posts(client: AsyncClient, empresa: Empresa, admin: Usuario):
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)

    # Criar post
    await client.post(
        "/api/v1/admin/posts",
        json={"titulo": "Post para Listar", "tipo": "post"},
        headers=auth_headers(token),
    )

    # Listar
    response = await client.get(
        "/api/v1/admin/posts",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_editar_post_optimistic_lock(client: AsyncClient, empresa: Empresa, admin: Usuario):
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)

    # Criar
    create_resp = await client.post(
        "/api/v1/admin/posts",
        json={"titulo": "Post Original", "tipo": "post"},
        headers=auth_headers(token),
    )
    post_id = create_resp.json()["data"]["id"]

    # Editar com versão correta
    edit_resp = await client.put(
        f"/api/v1/admin/posts/{post_id}",
        json={"titulo": "Post Editado", "versao": 1},
        headers=auth_headers(token),
    )
    assert edit_resp.status_code == 200
    assert edit_resp.json()["data"]["titulo"] == "Post Editado"
    assert edit_resp.json()["data"]["versao"] == 2

    # Editar com versão errada (conflito)
    conflict_resp = await client.put(
        f"/api/v1/admin/posts/{post_id}",
        json={"titulo": "Conflito", "versao": 1},
        headers=auth_headers(token),
    )
    assert conflict_resp.status_code == 409


@pytest.mark.asyncio
async def test_soft_delete_post(client: AsyncClient, empresa: Empresa, admin: Usuario):
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)

    # Criar
    create_resp = await client.post(
        "/api/v1/admin/posts",
        json={"titulo": "Post para Deletar", "tipo": "post"},
        headers=auth_headers(token),
    )
    post_id = create_resp.json()["data"]["id"]

    # Deletar
    del_resp = await client.delete(
        f"/api/v1/admin/posts/{post_id}",
        headers=auth_headers(token),
    )
    assert del_resp.status_code == 204

    # Verificar que não aparece mais
    get_resp = await client.get(
        f"/api/v1/admin/posts/{post_id}",
        headers=auth_headers(token),
    )
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_post_publico(client: AsyncClient, empresa: Empresa, admin: Usuario):
    token = criar_access_token(str(admin.id), str(admin.empresa_id), admin.role)

    # Criar post publicado
    await client.post(
        "/api/v1/admin/posts",
        json={"titulo": "Post Público", "tipo": "post", "publicado": True},
        headers=auth_headers(token),
    )

    # Listar pelo site público
    response = await client.get(
        "/api/v1/site/posts",
        headers={"X-Empresa-Slug": empresa.slug},
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1
