"""
Cria o primeiro superadmin no banco.
Uso: python create_superadmin.py
"""
import asyncio
from sqlalchemy import select
from app.core.database import async_session
from app.core.security import hash_senha
from app.models.usuario import Usuario


async def main():
    nome = input("Nome: ")
    email = input("Email: ")
    senha = input("Senha: ")

    async with async_session() as db:
        # Verificar se já existe
        result = await db.execute(select(Usuario).where(Usuario.email == email))
        if result.scalar_one_or_none():
            print(f"Usuário com email {email} já existe!")
            return

        user = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_senha(senha),
            role="superadmin",
            empresa_id=None,
            ativo=True,
        )
        db.add(user)
        await db.commit()
        print(f"Superadmin '{nome}' criado com sucesso!")


if __name__ == "__main__":
    asyncio.run(main())
