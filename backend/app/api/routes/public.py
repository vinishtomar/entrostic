"""Endpoints for candidates and anyone with a job link. No authentication."""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.analysis_queue import AnalysisQueue
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import Application, Company, CompanyStatus, CVDocument, Job, JobStatus
from app.schemas.application import ApplicationReceipt
from app.schemas.job import PublicCompanyOut, PublicJobOut, PublicJobSummary
from app.services.storage import InvalidUpload, save_cv, validate_cv

router = APIRouter(prefix="/public", tags=["public"])

ALREADY_APPLIED = "You've already applied for this position with this email."


def _public_job(slug: str, db: Session) -> Job:
    job = db.scalar(select(Job).join(Company).where(Job.slug == slug, Company.status == CompanyStatus.APPROVED))
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This job posting doesn't exist.")
    return job


@router.get("/jobs/{slug}", response_model=PublicJobOut)
def get_public_job(slug: str, db: Session = Depends(get_db)):
    job = _public_job(slug, db)
    return PublicJobOut(
        slug=job.slug,
        title=job.title,
        company_name=job.company.name,
        company_slug=job.company.slug,
        company_website=job.company.website,
        location=job.location,
        workplace_type=job.workplace_type,
        employment_type=job.employment_type,
        description=job.description,
        must_have_skills=job.must_have_skills,
        nice_to_have_skills=job.nice_to_have_skills,
        is_open=job.status == JobStatus.OPEN,
        posted_at=job.created_at,
    )


@router.post("/jobs/{slug}/apply", response_model=ApplicationReceipt, status_code=status.HTTP_201_CREATED)
def apply(
    slug: str,
    full_name: Annotated[str, Form(min_length=1, max_length=200)],
    email: Annotated[EmailStr, Form()],
    file: Annotated[UploadFile, File(description="CV as PDF or DOCX")],
    linkedin_url: Annotated[str | None, Form(max_length=300)] = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    queue: AnalysisQueue = Depends(),
):
    job = _public_job(slug, db)
    if job.status != JobStatus.OPEN:
        raise HTTPException(status.HTTP_410_GONE, "This position is no longer accepting applications.")

    email = email.lower()
    linkedin_url = (linkedin_url or "").strip() or None
    if linkedin_url and not re.match(r"^https?://", linkedin_url):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "LinkedIn URL must start with https://")
    if db.scalar(select(Application.id).where(Application.job_id == job.id, Application.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, ALREADY_APPLIED)

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = file.file.read(max_bytes + 1)  # read one byte past the limit to detect oversize files
    try:
        ext, mime = validate_cv(file.filename or "", data, max_bytes)
    except InvalidUpload as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e)) from e

    stored_name = save_cv(data, ext, settings.upload_dir)
    application = Application(
        job_id=job.id,
        full_name=full_name.strip(),
        email=email,
        linkedin_url=linkedin_url,
        cv=CVDocument(
            original_filename=(file.filename or f"cv{ext}")[:255],
            mime_type=mime,
            size_bytes=len(data),
            stored_name=stored_name,
        ),
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        # Lost a race with a concurrent submission; don't leave an orphan file.
        db.rollback()
        (settings.upload_dir / stored_name).unlink(missing_ok=True)
        raise HTTPException(status.HTTP_409_CONFLICT, ALREADY_APPLIED)

    queue.enqueue(application.id)
    return ApplicationReceipt(
        message="Your application has been submitted.",
        job_title=job.title,
        company_name=job.company.name,
    )


@router.get("/companies/{slug}", response_model=PublicCompanyOut)
def get_public_company(slug: str, db: Session = Depends(get_db)):
    company = db.scalar(select(Company).where(Company.slug == slug, Company.status == CompanyStatus.APPROVED))
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found.")
    jobs = db.scalars(
        select(Job).where(Job.company_id == company.id, Job.status == JobStatus.OPEN).order_by(Job.created_at.desc())
    )
    return PublicCompanyOut(
        name=company.name,
        slug=company.slug,
        website=company.website,
        jobs=[
            PublicJobSummary(
                slug=j.slug,
                title=j.title,
                location=j.location,
                workplace_type=j.workplace_type,
                employment_type=j.employment_type,
                posted_at=j.created_at,
            )
            for j in jobs
        ],
    )
