from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_owned_job, require_recruiter
from app.api.serializers import application_summary, job_out, stage_counts_by_job
from app.db.session import get_db
from app.models import Application, Job, JobStatus, User
from app.schemas.application import ApplicationSummary
from app.schemas.job import JobCreate, JobOut, JobUpdate
from app.services.slugs import job_slug

router = APIRouter(prefix="/jobs", tags=["jobs"])

# Columns that may be set to null via PATCH; for all others a null means "leave unchanged".
_NULLABLE = {"location"}


@router.get("", response_model=list[JobOut])
def list_jobs(user: User = Depends(require_recruiter), db: Session = Depends(get_db)):
    jobs = db.scalars(select(Job).where(Job.company_id == user.company_id).order_by(Job.created_at.desc())).all()
    counts = stage_counts_by_job(db, [j.id for j in jobs])
    return [job_out(j, counts[j.id]) for j in jobs]


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(body: JobCreate, user: User = Depends(require_recruiter), db: Session = Depends(get_db)):
    job = Job(
        **body.model_dump(),
        company_id=user.company_id,
        slug=job_slug(user.company.slug, body.title),
        status=JobStatus.OPEN,
        created_by_id=user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_out(job, stage_counts_by_job(db, [job.id])[job.id])


@router.get("/{job_id}", response_model=JobOut)
def get_job(job: Job = Depends(get_owned_job), db: Session = Depends(get_db)):
    return job_out(job, stage_counts_by_job(db, [job.id])[job.id])


@router.patch("/{job_id}", response_model=JobOut)
def update_job(body: JobUpdate, job: Job = Depends(get_owned_job), db: Session = Depends(get_db)):
    # The slug is deliberately not regenerated on title changes, so shared links keep working.
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is None and field not in _NULLABLE:
            continue
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job_out(job, stage_counts_by_job(db, [job.id])[job.id])


@router.get("/{job_id}/applications", response_model=list[ApplicationSummary])
def list_job_applications(job: Job = Depends(get_owned_job), db: Session = Depends(get_db)):
    apps = db.scalars(
        select(Application)
        .where(Application.job_id == job.id)
        .options(selectinload(Application.profile), selectinload(Application.job))
        .order_by(Application.created_at.desc())
    ).all()
    return [application_summary(a) for a in apps]
