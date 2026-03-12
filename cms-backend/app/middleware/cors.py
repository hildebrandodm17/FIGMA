from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    """Configura CORS com origens fixas + dinâmicas dos sites públicos."""
    origens = [
        settings.ADMIN_FRONTEND_URL,
        settings.SUPERADMIN_URL,
    ]

    # Em desenvolvimento, permitir localhost comum
    if settings.ENVIRONMENT == "development":
        origens.extend([
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
        ])

    # Remover strings vazias
    origens = [o for o in origens if o]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origens,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
    )
