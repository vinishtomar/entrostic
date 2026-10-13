import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.profile import CandidateProfileOut

StageLiteral = Literal["new", "screening", "interview", "offer", "hired", "rejected"]


class CVDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    original_filename: str
    mime_type: str
    size_bytes: int
    uploaded_at: datetime


class JobRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str


class ApplicationSummary(BaseModel):
    """List view for recruiters."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    analysis_status: Literal["pending", "processed", "failed"]
    stage: StageLiteral
    created_at: datetime
    job: JobRef
    headline: str | None = None
    seniority: str | None = None
    total_years_experience: float | None = None
    location: str | None = None
    skills: list[str] = []


class ApplicationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    linkedin_url: str | None
    analysis_status: Literal["pending", "processed", "failed"]
    analysis_detail: str | None
    stage: StageLiteral
    created_at: datetime
    job: JobRef
    cv: CVDocumentOut | None
    profile: CandidateProfileOut | None


class StageUpdate(BaseModel):
    stage: StageLiteral


class ApplicationReceipt(BaseModel):
    """The only thing a candidate gets back after applying. No profile or internal status."""

    message: str
    job_title: str
    company_name: str
