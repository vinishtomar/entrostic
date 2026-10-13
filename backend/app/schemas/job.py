import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

WorkplaceType = Literal["onsite", "hybrid", "remote"]
EmploymentType = Literal["full_time", "part_time", "contract", "internship"]
JobStatusLiteral = Literal["open", "closed"]


def _clean_skills(v: list[str]) -> list[str]:
    seen, out = set(), []
    for s in (x.strip() for x in v):
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s[:80])
    return out[:40]


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    workplace_type: WorkplaceType = "onsite"
    employment_type: EmploymentType = "full_time"
    description: str = Field(min_length=20, max_length=20000)
    must_have_skills: list[str] = []
    nice_to_have_skills: list[str] = []

    _clean = field_validator("must_have_skills", "nice_to_have_skills")(_clean_skills)


class JobUpdate(BaseModel):
    """Partial update: only fields that are sent are changed."""

    title: str | None = Field(default=None, min_length=2, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    workplace_type: WorkplaceType | None = None
    employment_type: EmploymentType | None = None
    description: str | None = Field(default=None, min_length=20, max_length=20000)
    must_have_skills: list[str] | None = None
    nice_to_have_skills: list[str] | None = None
    status: JobStatusLiteral | None = None

    @field_validator("must_have_skills", "nice_to_have_skills")
    @classmethod
    def _clean(cls, v: list[str] | None) -> list[str] | None:
        return None if v is None else _clean_skills(v)


class StageCounts(BaseModel):
    new: int = 0
    screening: int = 0
    interview: int = 0
    offer: int = 0
    hired: int = 0
    rejected: int = 0


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    location: str | None
    workplace_type: WorkplaceType
    employment_type: EmploymentType
    description: str
    must_have_skills: list[str]
    nice_to_have_skills: list[str]
    status: JobStatusLiteral
    created_at: datetime
    updated_at: datetime
    applicant_count: int = 0
    stage_counts: StageCounts = StageCounts()


class PublicJobOut(BaseModel):
    """What anyone with the share link can see. No internal fields."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    company_name: str
    company_slug: str
    company_website: str | None
    location: str | None
    workplace_type: WorkplaceType
    employment_type: EmploymentType
    description: str
    must_have_skills: list[str]
    nice_to_have_skills: list[str]
    is_open: bool
    posted_at: datetime


class PublicJobSummary(BaseModel):
    slug: str
    title: str
    location: str | None
    workplace_type: WorkplaceType
    employment_type: EmploymentType
    posted_at: datetime


class PublicCompanyOut(BaseModel):
    name: str
    slug: str
    website: str | None
    jobs: list[PublicJobSummary]
