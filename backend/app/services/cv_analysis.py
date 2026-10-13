"""Pipeline run in the background after upload: CV file -> text -> Claude -> stored profile."""

import logging
import uuid
from collections.abc import Callable
from pathlib import Path

from sqlalchemy.orm import Session, sessionmaker

from app.models import AnalysisStatus, Application, CandidateProfile
from app.services.cv_extractor import CVExtractor, ExtractionError
from app.services.cv_text import extract_text

logger = logging.getLogger(__name__)


def analyze_application(
    application_id: uuid.UUID,
    session_factory: sessionmaker[Session],
    extractor_factory: Callable[[], CVExtractor],
    upload_dir: Path,
) -> None:
    # Logs carry the application id only, never CV contents (personal data).
    with session_factory() as db:
        application = db.get(Application, application_id)
        if application is None or application.cv is None:
            logger.warning("Application %s missing or has no CV; skipping analysis", application_id)
            return

        try:
            cv = application.cv
            path = upload_dir / cv.stored_name
            if not path.exists():
                raise ExtractionError("The uploaded CV file is missing from storage.")

            cv.raw_text = extract_text(path, cv.mime_type)
            extractor = extractor_factory()
            result = extractor(path, cv.mime_type, cv.raw_text)
            if not result.is_cv:
                raise ExtractionError("The uploaded document does not appear to be a CV.")

            _save_profile(db, application, result, extractor.model)
            application.analysis_status = AnalysisStatus.PROCESSED
            application.analysis_detail = None
            logger.info("Application %s analysed", application_id)
        except ExtractionError as e:
            application.analysis_status = AnalysisStatus.FAILED
            application.analysis_detail = str(e)
            logger.warning("Application %s analysis failed: %s", application_id, e)
        except Exception:
            application.analysis_status = AnalysisStatus.FAILED
            application.analysis_detail = "Unexpected error during analysis."
            logger.exception("Application %s analysis crashed", application_id)
        db.commit()


def _save_profile(db: Session, application: Application, result, model: str) -> None:
    data = result.model_dump(exclude={"is_cv"})
    profile = application.profile or CandidateProfile(application_id=application.id)
    for key, value in data.items():
        setattr(profile, key, value)
    profile.ai_model = model
    db.add(profile)
