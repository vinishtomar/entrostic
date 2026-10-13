from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(response: Response, db: Session = Depends(get_db)) -> dict:
    """Readiness check used by the hosting platform: 503 until the database is reachable."""
    db_ok, pgvector_ok = False, False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
        pgvector_ok = (
            db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")).scalar()
            is not None
        )
    except SQLAlchemyError:
        pass

    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "status": "ok" if db_ok else "unavailable",
        "database": db_ok,
        "pgvector": pgvector_ok,
        "ai_configured": bool(get_settings().anthropic_api_key),
    }
