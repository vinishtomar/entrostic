"""Conversions from ORM objects to API shapes that need more than attribute copying."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Application, Job
from app.schemas.application import ApplicationSummary, JobRef
from app.schemas.job import JobOut, StageCounts


def application_summary(a: Application) -> ApplicationSummary:
    p = a.profile
    return ApplicationSummary(
        id=a.id,
        full_name=a.full_name,
        email=a.email,
        analysis_status=a.analysis_status,
        stage=a.stage,
        created_at=a.created_at,
        job=JobRef.model_validate(a.job),
        headline=p.headline if p else None,
        seniority=p.seniority if p else None,
        total_years_experience=p.total_years_experience if p else None,
        location=p.location if p else None,
        skills=p.skills if p else [],
    )


def stage_counts_by_job(db: Session, job_ids: list[uuid.UUID]) -> dict[uuid.UUID, StageCounts]:
    counts: dict[uuid.UUID, StageCounts] = {jid: StageCounts() for jid in job_ids}
    if not job_ids:
        return counts
    rows = db.execute(
        select(Application.job_id, Application.stage, func.count())
        .where(Application.job_id.in_(job_ids))
        .group_by(Application.job_id, Application.stage)
    )
    for job_id, stage, n in rows:
        setattr(counts[job_id], stage, n)
    return counts


def job_out(job: Job, counts: StageCounts) -> JobOut:
    out = JobOut.model_validate(job)
    out.stage_counts = counts
    out.applicant_count = sum(counts.model_dump().values())
    return out
