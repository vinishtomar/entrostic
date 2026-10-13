"""Authentication and tenant-scoping dependencies.

Every recruiter endpoint loads data through `get_owned_job` / `get_owned_application`,
which return 404 (not 403) for other companies' records, so IDs from another
tenant are indistinguishable from IDs that don't exist.
"""

import uuid
from datetime import UTC, datetime

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import hash_token
from app.db.session import get_db
from app.models import Application, CompanyStatus, Job, User, UserRole, UserSession

NOT_AUTHENTICATED = HTTPException(status.HTTP_401_UNAUTHORIZED, "Please sign in.")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise NOT_AUTHENTICATED
    session = db.get(UserSession, hash_token(token))
    if session is None or session.expires_at <= datetime.now(UTC):
        raise NOT_AUTHENTICATED
    user = session.user
    if not user.is_active:
        raise NOT_AUTHENTICATED
    if user.role == UserRole.RECRUITER and (user.company is None or user.company.status != CompanyStatus.APPROVED):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your company does not have access.")
    return user


def require_recruiter(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.RECRUITER:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Recruiter access only.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access only.")
    return user


def get_owned_job(job_id: uuid.UUID, user: User = Depends(require_recruiter), db: Session = Depends(get_db)) -> Job:
    job = db.get(Job, job_id)
    if job is None or job.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found.")
    return job


def get_owned_application(
    application_id: uuid.UUID, user: User = Depends(require_recruiter), db: Session = Depends(get_db)
) -> Application:
    app_ = db.get(Application, application_id)
    if app_ is None or app_.job.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return app_
