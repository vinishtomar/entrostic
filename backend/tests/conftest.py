"""Test fixtures: a separate `<db>_test` database and a temp upload folder per test."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registers models on Base.metadata)
from app.api.analysis_queue import get_extractor_factory
from app.core.config import get_settings
from app.db.session import Base, get_db, get_session_factory
from app.main import app
from app.schemas.profile import CVProfile, Education, WorkExperience
from app.services.cv_extractor import ExtractionError

_dev_url = make_url(get_settings().database_url)
TEST_URL = _dev_url.set(database=f"{_dev_url.database}_test")


@pytest.fixture(scope="session")
def engine():
    admin = create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": TEST_URL.database})
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{TEST_URL.database}"'))
    admin.dispose()

    eng = create_engine(TEST_URL)
    with eng.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


SAMPLE_PROFILE = CVProfile(
    is_cv=True,
    headline="Senior Backend Engineer, Python",
    summary="Backend engineer with 7 years building APIs.",
    location="Berlin, Germany",
    total_years_experience=7.0,
    seniority="senior",
    skills=["Python", "FastAPI", "PostgreSQL"],
    soft_skills=["Mentoring"],
    languages=["English (C2)"],
    certifications=[],
    experience=[WorkExperience(title="Senior Engineer", company="Acme", start="2021-01", end=None, highlights=["Led API team"])],
    education=[Education(institution="TU Berlin", degree="MSc", field_of_study="Computer Science", graduation_year=2017)],
)


class FakeExtractor:
    """Stands in for Claude. Set `.result` or `.error` in a test to change behaviour."""

    model = "fake-model"

    def __init__(self):
        self.result: CVProfile = SAMPLE_PROFILE
        self.error: ExtractionError | None = None
        self.calls: list[tuple] = []

    def __call__(self, cv_path, mime_type, text):
        self.calls.append((cv_path, mime_type, text))
        if self.error:
            raise self.error
        return self.result


@pytest.fixture
def fake_extractor():
    return FakeExtractor()


@pytest.fixture
def session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def client(engine, tmp_path, fake_extractor, session_factory):
    TestSession = session_factory

    def _get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    test_settings = get_settings().model_copy(update={"upload_dir": tmp_path, "max_upload_mb": 1})
    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_session_factory] = lambda: TestSession
    app.dependency_overrides[get_extractor_factory] = lambda: (lambda: fake_extractor)

    yield TestClient(app)

    app.dependency_overrides.clear()
    clear_tables(engine)


def clear_tables(engine):
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def new_client(client):
    """Factory for extra browser-like clients (separate cookie jars), sharing the same overrides."""
    return lambda: TestClient(app)
