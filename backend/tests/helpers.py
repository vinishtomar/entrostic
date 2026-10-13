import io

from docx import Document

from app.core.security import hash_password
from app.models import User, UserRole

PDF = b"%PDF-1.4\n%fake minimal pdf for tests\n"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PASSWORD = "correct-horse-battery"

JOB = {
    "title": "Senior Backend Engineer",
    "location": "Berlin",
    "workplace_type": "hybrid",
    "employment_type": "full_time",
    "description": "Build and scale our Python APIs. " * 3,
    "must_have_skills": ["Python", "PostgreSQL", "python "],
    "nice_to_have_skills": ["Kafka"],
}


def make_docx(*paragraphs: str) -> bytes:
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def create_admin(session_factory, email="admin@platform.example.com"):
    with session_factory() as db:
        db.add(User(email=email, full_name="Admin", password_hash=hash_password(PASSWORD), role=UserRole.ADMIN))
        db.commit()


def login(client, email, password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def signup(client, company="Acme Corp", email="rec@acme.example.com"):
    return client.post(
        "/api/auth/signup",
        json={"company_name": company, "full_name": "Rita Recruiter", "email": email, "password": PASSWORD},
    )


def approved_recruiter(new_client, session_factory, company="Acme Corp", email="rec@acme.example.com"):
    """Sign up a company, approve it as admin, and return a logged-in recruiter client."""
    with session_factory() as db:
        has_admin = db.query(User).filter(User.role == UserRole.ADMIN).count() > 0
    if not has_admin:
        create_admin(session_factory)
    admin = new_client()
    assert login(admin, "admin@platform.example.com").status_code == 200

    rec = new_client()
    assert signup(rec, company, email).status_code == 201
    company_id = next(c["id"] for c in admin.get("/api/admin/companies").json() if c["contact_email"] == email)
    assert admin.post(f"/api/admin/companies/{company_id}/approve").status_code == 200
    assert login(rec, email).status_code == 200
    return rec


def apply(client, slug, *, name="Ada Lovelace", email="ada@example.com", filename="cv.pdf", content=PDF,
          mime="application/pdf", linkedin=None):
    data = {"full_name": name, "email": email}
    if linkedin is not None:
        data["linkedin_url"] = linkedin
    return client.post(f"/api/public/jobs/{slug}/apply", data=data, files={"file": (filename, content, mime)})
