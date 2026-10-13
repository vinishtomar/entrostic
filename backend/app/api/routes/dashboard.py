from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_recruiter
from app.api.serializers import application_summary
from app.db.session import get_db
from app.models import Application, Job, JobStatus, User
from app.schemas.application import ApplicationSummary
from app.schemas.job import StageCounts

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

TREND_DAYS = 14


class DailyCount(BaseModel):
    date: date
    count: int


class DashboardSummary(BaseModel):
    open_jobs: int
    total_jobs: int
    total_applications: int
    new_this_week: int
    stage_counts: StageCounts
    daily_applications: list[DailyCount]
    recent_applications: list[ApplicationSummary]


@router.get("/summary", response_model=DashboardSummary)
def summary(user: User = Depends(require_recruiter), db: Session = Depends(get_db)):
    company_apps = select(Application).join(Job).where(Job.company_id == user.company_id)
    now = datetime.now(UTC)

    jobs_by_status = dict(
        db.execute(select(Job.status, func.count()).where(Job.company_id == user.company_id).group_by(Job.status)).all()
    )
    stage_rows = db.execute(
        select(Application.stage, func.count()).join(Job).where(Job.company_id == user.company_id).group_by(Application.stage)
    ).all()
    stages = StageCounts(**{s: n for s, n in stage_rows})

    new_this_week = db.scalar(
        select(func.count()).select_from(company_apps.where(Application.created_at >= now - timedelta(days=7)).subquery())
    )

    start = (now - timedelta(days=TREND_DAYS - 1)).date()
    day = func.date(Application.created_at)
    per_day = dict(
        db.execute(
            select(day, func.count())
            .join(Job)
            .where(Job.company_id == user.company_id, day >= start)
            .group_by(day)
        ).all()
    )
    daily = [DailyCount(date=d, count=per_day.get(d, 0)) for d in (start + timedelta(days=i) for i in range(TREND_DAYS))]

    recent = db.scalars(
        company_apps.options(selectinload(Application.profile), selectinload(Application.job))
        .order_by(Application.created_at.desc())
        .limit(8)
    ).all()

    return DashboardSummary(
        open_jobs=jobs_by_status.get(JobStatus.OPEN, 0),
        total_jobs=sum(jobs_by_status.values()),
        total_applications=sum(stages.model_dump().values()),
        new_this_week=new_this_week or 0,
        stage_counts=stages,
        daily_applications=daily,
        recent_applications=[application_summary(a) for a in recent],
    )
