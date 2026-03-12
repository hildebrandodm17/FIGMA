import asyncio
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_senha
from app.models import Base
from app.models.empresa import Empresa
from app.models.empresa_modulo import MODULOS_PADRAO, EmpresaModulo
from app.models.usuario import Usuario

# Usar banco de teste
TEST_DATABASE_URL = settings.DATABASE_URL.replace("/cms_db", "/cms_db_test")

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_test = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_test() as session:
        yield session

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def empresa(db: AsyncSession) -> Empresa:
    emp = Empresa(
        id=uuid4(),
        nome="Empresa Teste",
        slug="empresa-teste",
        dominio="teste.com.br",
        plano="basico",
    )
    db.add(emp)

    for modulo in MODULOS_PADRAO:
        db.add(EmpresaModulo(empresa_id=emp.id, modulo=modulo, ativo=True))

    await db.commit()
    await db.refresh(emp)
    return emp


@pytest_asyncio.fixture
async def admin(db: AsyncSession, empresa: Empresa) -> Usuario:
    user = Usuario(
        id=uuid4(),
        empresa_id=empresa.id,
        nome="Admin Teste",
        email="admin@teste.com",
        senha_hash=hash_senha("senha123"),
        role="admin",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def superadmin(db: AsyncSession) -> Usuario:
    user = Usuario(
        id=uuid4(),
        empresa_id=None,
        nome="Super Admin",
        email="super@cms.com",
        senha_hash=hash_senha("super123"),
        role="superadmin",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    from main import app
    from app.core.database import get_db

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


def auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}
