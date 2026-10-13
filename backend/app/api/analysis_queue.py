import uuid
from collections.abc import Callable

from fastapi import BackgroundTasks, Depends
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.db.session import get_session_factory
from app.services.cv_analysis import analyze_application
from app.services.cv_extractor import ClaudeCVExtractor, CVExtractor


def get_extractor_factory(settings: Settings = Depends(get_settings)) -> Callable[[], CVExtractor]:
    """Overridden in tests so no real AI calls are made."""
    return lambda: ClaudeCVExtractor(settings)


class AnalysisQueue:
    """Dependency that runs CV analysis after the response is sent."""

    def __init__(
        self,
        tasks: BackgroundTasks,
        session_factory: sessionmaker[Session] = Depends(get_session_factory),
        extractor_factory: Callable[[], CVExtractor] = Depends(get_extractor_factory),
        settings: Settings = Depends(get_settings),
    ):
        self._tasks = tasks
        self._session_factory = session_factory
        self._extractor_factory = extractor_factory
        self._upload_dir = settings.upload_dir

    def enqueue(self, application_id: uuid.UUID) -> None:
        self._tasks.add_task(
            analyze_application, application_id, self._session_factory, self._extractor_factory, self._upload_dir
        )
