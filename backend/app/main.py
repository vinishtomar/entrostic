import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, applications, auth, dashboard, health, jobs, public
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    docs_url="/docs" if settings.expose_docs else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.expose_docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,  # the browser sends the session cookie to the API
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (health, auth, admin, jobs, applications, dashboard, public):
    app.include_router(module.router, prefix="/api")


@app.get("/")
def root() -> dict:
    return {"name": settings.app_name}
