from tests.helpers import DOCX_MIME, JOB, apply, approved_recruiter, make_docx


def test_job_crud_and_skill_cleanup(client, new_client, session_factory):
    rec = approved_recruiter(new_client, session_factory)
    r = rec.post("/api/jobs", json=JOB)
    assert r.status_code == 201, r.text
    job = r.json()
    assert job["slug"].startswith("acme-corp-senior-backend-engineer-")
    assert job["must_have_skills"] == ["Python", "PostgreSQL"]  # trimmed + de-duplicated
    assert job["status"] == "open" and job["applicant_count"] == 0

    r = rec.patch(f"/api/jobs/{job['id']}", json={"title": "Staff Backend Engineer", "status": "closed"})
    assert r.json()["title"] == "Staff Backend Engineer"
    assert r.json()["slug"] == job["slug"]  # share link survives renames
    assert [j["status"] for j in rec.get("/api/jobs").json()] == ["closed"]


def test_unauthenticated_cannot_access_recruiter_api(client):
    assert client.get("/api/jobs").status_code == 401
    assert client.get("/api/applications").status_code == 401
    assert client.get("/api/dashboard/summary").status_code == 401


def test_companies_cannot_see_each_others_data(client, new_client, session_factory):
    acme = approved_recruiter(new_client, session_factory, "Acme Corp", "rec@acme.example.com")
    globex = approved_recruiter(new_client, session_factory, "Globex", "rec@globex.example.com")

    job = acme.post("/api/jobs", json=JOB).json()
    apply(client, job["slug"])
    app_id = acme.get("/api/applications").json()[0]["id"]

    assert globex.get("/api/jobs").json() == []
    assert globex.get("/api/applications").json() == []
    assert globex.get(f"/api/jobs/{job['id']}").status_code == 404
    assert globex.patch(f"/api/jobs/{job['id']}", json={"status": "closed"}).status_code == 404
    assert globex.get(f"/api/jobs/{job['id']}/applications").status_code == 404
    assert globex.get(f"/api/applications/{app_id}").status_code == 404
    assert globex.get(f"/api/applications/{app_id}/cv").status_code == 404
    assert globex.delete(f"/api/applications/{app_id}").status_code == 404
    assert globex.get("/api/dashboard/summary").json()["total_applications"] == 0


def test_public_job_page_and_apply_flow(client, new_client, session_factory, fake_extractor):
    rec = approved_recruiter(new_client, session_factory)
    job = rec.post("/api/jobs", json=JOB).json()

    public = client.get(f"/api/public/jobs/{job['slug']}").json()
    assert public["company_name"] == "Acme Corp" and public["is_open"]
    assert "id" not in public and "company_id" not in public

    r = apply(client, job["slug"], linkedin="https://linkedin.com/in/ada")
    assert r.status_code == 201, r.text
    receipt = r.json()
    assert receipt == {"message": "Your application has been submitted.", "job_title": JOB["title"], "company_name": "Acme Corp"}

    apps = rec.get(f"/api/jobs/{job['id']}/applications").json()
    assert len(apps) == 1
    a = apps[0]
    assert a["analysis_status"] == "processed" and a["stage"] == "new"
    assert a["headline"].startswith("Senior Backend") and "Python" in a["skills"]

    detail = rec.get(f"/api/applications/{a['id']}").json()
    assert detail["linkedin_url"] == "https://linkedin.com/in/ada"
    assert detail["profile"]["seniority"] == "senior"
    assert rec.get(f"/api/jobs/{job['id']}").json()["stage_counts"]["new"] == 1


def test_duplicate_application_rejected(client, new_client, session_factory):
    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    assert apply(client, slug, email="Ada@Example.com").status_code == 201
    assert apply(client, slug, email="ada@example.com").status_code == 409


def test_closed_job_rejects_applications(client, new_client, session_factory):
    rec = approved_recruiter(new_client, session_factory)
    job = rec.post("/api/jobs", json=JOB).json()
    rec.patch(f"/api/jobs/{job['id']}", json={"status": "closed"})
    assert client.get(f"/api/public/jobs/{job['slug']}").json()["is_open"] is False
    assert apply(client, job["slug"]).status_code == 410


def test_unknown_or_unapproved_company_job_is_404(client, new_client, session_factory):
    assert client.get("/api/public/jobs/nope").status_code == 404
    assert apply(client, "nope").status_code == 404


def test_upload_validation(client, new_client, session_factory, tmp_path):
    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    assert apply(client, slug, filename="cv.exe", content=b"MZ").status_code == 422
    assert apply(client, slug, filename="cv.pdf", content=b"not a pdf").status_code == 422
    assert apply(client, slug, content=b"%PDF" + b"x" * (1024 * 1024)).status_code == 422
    assert apply(client, slug, email="nope").status_code == 422
    assert apply(client, slug, linkedin="javascript:alert(1)").status_code == 422
    assert list(tmp_path.iterdir()) == []


def test_docx_text_reaches_extractor(client, new_client, session_factory, fake_extractor):
    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    r = apply(client, slug, filename="cv.docx", content=make_docx("Grace Hopper", "COBOL pioneer"), mime=DOCX_MIME)
    assert r.status_code == 201
    assert "COBOL pioneer" in fake_extractor.calls[0][2]


def test_failed_analysis_then_retry(client, new_client, session_factory, fake_extractor):
    from app.services.cv_extractor import ExtractionError

    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    fake_extractor.error = ExtractionError("AI service temporarily unavailable; please retry later.")
    apply(client, slug)
    app_id = rec.get("/api/applications").json()[0]["id"]
    d = rec.get(f"/api/applications/{app_id}").json()
    assert d["analysis_status"] == "failed" and "temporarily" in d["analysis_detail"]

    fake_extractor.error = None
    assert rec.post(f"/api/applications/{app_id}/analyze").status_code == 202
    assert rec.get(f"/api/applications/{app_id}").json()["analysis_status"] == "processed"


def test_stage_update_cv_download_and_delete(client, new_client, session_factory, tmp_path):
    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    apply(client, slug)
    app_id = rec.get("/api/applications").json()[0]["id"]

    assert rec.patch(f"/api/applications/{app_id}", json={"stage": "interview"}).json()["stage"] == "interview"
    assert rec.patch(f"/api/applications/{app_id}", json={"stage": "bogus"}).status_code == 422

    cv = rec.get(f"/api/applications/{app_id}/cv")
    assert cv.status_code == 200 and cv.content.startswith(b"%PDF")

    assert rec.delete(f"/api/applications/{app_id}").status_code == 204
    assert rec.get(f"/api/applications/{app_id}").status_code == 404
    assert list(tmp_path.iterdir()) == []  # file removed too


def test_dashboard_summary(client, new_client, session_factory):
    rec = approved_recruiter(new_client, session_factory)
    slug = rec.post("/api/jobs", json=JOB).json()["slug"]
    apply(client, slug, email="a@x.example.com")
    apply(client, slug, email="b@x.example.com")
    s = rec.get("/api/dashboard/summary").json()
    assert s["open_jobs"] == 1 and s["total_applications"] == 2 and s["new_this_week"] == 2
    assert s["stage_counts"]["new"] == 2
    assert len(s["daily_applications"]) == 14 and s["daily_applications"][-1]["count"] == 2
    assert len(s["recent_applications"]) == 2


def test_public_careers_page_lists_only_open_jobs(client, new_client, session_factory):
    rec = approved_recruiter(new_client, session_factory)
    open_job = rec.post("/api/jobs", json=JOB).json()
    closed = rec.post("/api/jobs", json={**JOB, "title": "Old role"}).json()
    rec.patch(f"/api/jobs/{closed['id']}", json={"status": "closed"})
    page = client.get("/api/public/companies/acme-corp").json()
    assert [j["slug"] for j in page["jobs"]] == [open_job["slug"]]
