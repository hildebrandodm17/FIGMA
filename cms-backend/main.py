import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.admin.router import router as admin_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.public.router import router as public_router
from app.api.v1.superadmin.router import router as superadmin_router
from app.core.config import settings
from app.middleware.cors import setup_cors
from app.middleware.rate_limit import setup_rate_limit

app = FastAPI(
    title="CMS Headless Multi-tenant",
    description="API REST para gerenciamento de conteúdo multi-tenant",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Middlewares
setup_cors(app)
setup_rate_limit(app)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# Routers da API (sempre antes dos arquivos estáticos)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(public_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(superadmin_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Frontend estático (React build) ─────────────────────────
# O build do React fica em ../cms-admin/dist (ou STATIC_DIR via env)
STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).resolve().parent.parent / "cms-admin" / "dist"))

if STATIC_DIR.exists():
    # Servir assets estáticos (JS, CSS, imagens do build)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static-assets")

    # Catch-all: qualquer rota que não seja /api/* ou /health devolve index.html (SPA)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Se o arquivo existe no build (favicon.ico, robots.txt, etc.), serve direto
        file_path = STATIC_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        # Senão, devolve index.html para o React Router resolver
        return FileResponse(STATIC_DIR / "index.html")
