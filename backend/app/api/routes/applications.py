from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.analysis_queue import AnalysisQueue
from app.api.deps import get_owned_application, require_recruiter
from app.api.serializers import application_summary
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import AnalysisStatus, Application, Job, User
from app.schemas.application import ApplicationDetail, ApplicationSummary, StageUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationSummary])
def list_applications(user: User = Depends(require_recruiter), db: Session = Depends(get_db)):
    """All applications across the company's jobs, newest first."""
    apps = db.scalars(
        select(Application)
        .join(Job)
        .where(Job.company_id == user.company_id)
        .options(selectinload(Application.profile), selectinload(Application.job))
        .order_by(Application.created_at.desc())
        .limit(500)
    ).all()
    return [application_summary(a) for a in apps]


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(application: Application = Depends(get_owned_application)):
    return application


@router.patch("/{application_id}", response_model=ApplicationDetail)
def update_stage(
    body: StageUpdate,
    application: Application = Depends(get_owned_application),
    db: Session = Depends(get_db),
):
    application.stage = body.stage
    db.commit()
    db.refresh(application)
    return application


@router.post("/{application_id}/analyze", response_model=ApplicationDetail, status_code=status.HTTP_202_ACCEPTED)
def reanalyze(
    application: Application = Depends(get_owned_application),
    queue: AnalysisQueue = Depends(),
    db: Session = Depends(get_db),
):
    application.analysis_status = AnalysisStatus.PENDING
    application.analysis_detail = None
    db.commit()
    db.refresh(application)
    queue.enqueue(application.id)
    return application


@router.get("/{application_id}/cv")
def download_cv(application: Application = Depends(get_owned_application), settings: Settings = Depends(get_settings)):
    cv = application.cv
    path = settings.upload_dir / cv.stored_name if cv else None
    if path is None or not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV file not found.")
    return FileResponse(path, media_type=cv.mime_type, filename=cv.original_filename)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application: Application = Depends(get_owned_application),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    """Permanently remove an application and its CV file (e.g. a GDPR erasure request)."""
    stored_name = application.cv.stored_name if application.cv else None
    db.delete(application)
    db.commit()
    if stored_name:
        (settings.upload_dir / stored_name).unlink(missing_ok=True)
