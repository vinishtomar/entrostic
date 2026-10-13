"""The structured profile Claude extracts from a CV.

This schema is sent to Claude as the required output format, so field descriptions
double as extraction instructions. It deliberately has NO fields for protected
characteristics (age, gender, nationality, marital status, photo, religion, ...):
what isn't extracted can't bias matching later.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Seniority = Literal["intern", "junior", "mid", "senior", "lead", "principal", "executive", "unknown"]


class WorkExperience(BaseModel):
    title: str = Field(description="Job title as written")
    company: str
    start: str | None = Field(description="Start date as YYYY-MM or YYYY; null if not stated")
    end: str | None = Field(description="End date as YYYY-MM or YYYY; null if this is the current role")
    highlights: list[str] = Field(description="Up to 5 key achievements/responsibilities, each one short sentence")


class Education(BaseModel):
    institution: str
    degree: str | None = Field(description="e.g. 'BSc', 'MSc', 'PhD', 'Bootcamp certificate'")
    field_of_study: str | None
    graduation_year: int | None


class CVProfile(BaseModel):
    is_cv: bool = Field(description="False if the document is not a CV/resume; other fields may then be empty")
    headline: str = Field(description="One-line professional headline, e.g. 'Senior Backend Engineer, Python/AWS'")
    summary: str = Field(description="3-4 sentence neutral summary of the candidate's professional background")
    location: str | None = Field(description="City/region/country if stated; null otherwise")
    total_years_experience: float | None = Field(
        description="Total years of professional experience computed from the work history; null if unclear"
    )
    seniority: Seniority = Field(description="Overall seniority judged from roles, scope and years")
    skills: list[str] = Field(
        description="Technical and domain skills, tools, frameworks and methods; canonical names (e.g. 'PostgreSQL' not 'postgres')"
    )
    soft_skills: list[str]
    languages: list[str] = Field(description="Spoken languages, with level if stated, e.g. 'German (C1)'")
    certifications: list[str]
    experience: list[WorkExperience] = Field(description="Most recent first")
    education: list[Education]


class CandidateProfileOut(BaseModel):
    """API response shape for a stored profile."""

    model_config = ConfigDict(from_attributes=True)

    headline: str
    summary: str
    location: str | None
    total_years_experience: float | None
    seniority: str
    skills: list[str]
    soft_skills: list[str]
    languages: list[str]
    certifications: list[str]
    experience: list[WorkExperience]
    education: list[Education]
    ai_model: str
    analyzed_at: datetime
