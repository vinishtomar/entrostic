# Import every model here so Alembic autogenerate and Base.metadata see them.
from app.models.application import AnalysisStatus, Application, CVDocument, Stage
from app.models.company import Company, CompanyStatus, User, UserRole, UserSession
from app.models.job import Job, JobStatus
from app.models.profile import CandidateProfile

__all__ = [
    "AnalysisStatus", "Application", "CVDocument", "Stage",
    "Company", "CompanyStatus", "User", "UserRole", "UserSession",
    "Job", "JobStatus",
    "CandidateProfile",
]
