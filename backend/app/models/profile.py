import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CandidateProfile(Base):
    """Structured profile extracted from an application's CV; overwritten on re-analysis."""

    __tablename__ = "candidate_profiles"

    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True
    )
    headline: Mapped[str] = mapped_column(String(300))
    summary: Mapped[str] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(200))
    total_years_experience: Mapped[float | None] = mapped_column(Float)
    seniority: Mapped[str] = mapped_column(String(20))
    skills: Mapped[list[str]] = mapped_column(ARRAY(String))
    soft_skills: Mapped[list[str]] = mapped_column(ARRAY(String))
    languages: Mapped[list[str]] = mapped_column(ARRAY(String))
    certifications: Mapped[list[str]] = mapped_column(ARRAY(String))
    experience: Mapped[list[dict]] = mapped_column(JSONB)
    education: Mapped[list[dict]] = mapped_column(JSONB)
    # Which model produced this profile (useful when comparing models later).
    ai_model: Mapped[str] = mapped_column(String(100))
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    application: Mapped["Application"] = relationship(back_populates="profile")  # noqa: F821
