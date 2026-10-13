import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AnalysisStatus(enum.StrEnum):
    PENDING = "pending"  # CV stored, profile extraction queued/running
    PROCESSED = "processed"
    FAILED = "failed"  # can be retried by a recruiter


class Stage(enum.StrEnum):
    """Recruiter's hiring pipeline. Independent of the automated analysis status."""

    NEW = "new"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


class Application(Base):
    """One candidate applying to one job. Scoped to the job's company."""

    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "email", name="uq_application_job_email"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320))
    linkedin_url: Mapped[str | None] = mapped_column(String(300))
    analysis_status: Mapped[str] = mapped_column(String(20), default=AnalysisStatus.PENDING)
    analysis_detail: Mapped[str | None] = mapped_column(String(500))  # reason when FAILED
    stage: Mapped[str] = mapped_column(String(20), default=Stage.NEW)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job: Mapped["Job"] = relationship(back_populates="applications")  # noqa: F821
    cv: Mapped["CVDocument | None"] = relationship(
        back_populates="application", uselist=False, cascade="all, delete-orphan"
    )
    profile: Mapped["CandidateProfile | None"] = relationship(  # noqa: F821
        back_populates="application", uselist=False, cascade="all, delete-orphan"
    )


class CVDocument(Base):
    __tablename__ = "cv_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), unique=True
    )
    original_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    # File name inside UPLOAD_DIR (not an absolute path, so the folder can move).
    stored_name: Mapped[str] = mapped_column(String(255))
    raw_text: Mapped[str | None] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    application: Mapped[Application] = relationship(back_populates="cv")
