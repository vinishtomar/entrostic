import enum
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class JobStatus(enum.StrEnum):
    OPEN = "open"  # public link works, accepting applications
    CLOSED = "closed"  # link shows "no longer accepting applications"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    # Public share link: /j/<slug>. Includes a random suffix so links aren't guessable.
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    location: Mapped[str | None] = mapped_column(String(200))
    workplace_type: Mapped[str] = mapped_column(String(20))  # onsite | hybrid | remote
    employment_type: Mapped[str] = mapped_column(String(20))  # full_time | part_time | contract | internship
    description: Mapped[str] = mapped_column(Text)
    must_have_skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    nice_to_have_skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    status: Mapped[str] = mapped_column(String(20), default=JobStatus.OPEN)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company: Mapped["Company"] = relationship(back_populates="jobs")  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        back_populates="job", cascade="all, delete-orphan"
    )
