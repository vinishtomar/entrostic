from tests.helpers import PASSWORD, create_admin, login, signup


def test_signup_creates_pending_company_that_cannot_log_in(client):
    r = signup(client)
    assert r.status_code == 201
    r = login(client, "rec@acme.example.com")
    assert r.status_code == 403
    assert "being reviewed" in r.json()["detail"]


def test_duplicate_signup_email(client):
    signup(client)
    assert signup(client, company="Other").status_code == 409


def test_weak_password_rejected(client):
    r = client.post("/api/auth/signup", json={"company_name": "Acme", "full_name": "R", "email": "a@b.example.com", "password": "short"})
    assert r.status_code == 422


def test_admin_approves_then_recruiter_logs_in(client, new_client, session_factory):
    create_admin(session_factory)
    signup(client)

    admin = new_client()
    assert login(admin, "admin@platform.example.com").status_code == 200
    pending = admin.get("/api/admin/companies", params={"status": "pending"}).json()
    assert [c["name"] for c in pending] == ["Acme Corp"]
    assert pending[0]["contact_email"] == "rec@acme.example.com"
    assert admin.post(f"/api/admin/companies/{pending[0]['id']}/approve").json()["status"] == "approved"

    r = login(client, "rec@acme.example.com")
    assert r.status_code == 200
    assert r.json()["company"]["slug"] == "acme-corp"
    me = client.get("/api/auth/me").json()
    assert me["role"] == "recruiter"


def test_rejected_company_cannot_log_in(client, new_client, session_factory):
    create_admin(session_factory)
    signup(client)
    admin = new_client()
    login(admin, "admin@platform.example.com")
    cid = admin.get("/api/admin/companies").json()[0]["id"]
    admin.post(f"/api/admin/companies/{cid}/reject")
    assert "not approved" in login(client, "rec@acme.example.com").json()["detail"]


def test_wrong_password_and_unknown_email_look_identical(client, session_factory):
    create_admin(session_factory)
    a = login(client, "admin@platform.example.com", "wrong-password-123")
    b = login(client, "nobody@nowhere.example.com", PASSWORD)
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()


def test_session_cookie_is_httponly(client, session_factory):
    create_admin(session_factory)
    r = login(client, "admin@platform.example.com")
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie


def test_logout_invalidates_session(client, session_factory):
    create_admin(session_factory)
    login(client, "admin@platform.example.com")
    assert client.get("/api/auth/me").status_code == 200
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_admin_endpoints_require_admin(client, new_client, session_factory):
    assert client.get("/api/admin/companies").status_code == 401
    from tests.helpers import approved_recruiter

    rec = approved_recruiter(new_client, session_factory)
    assert rec.get("/api/admin/companies").status_code == 403


def test_admin_cannot_use_recruiter_endpoints(client, session_factory):
    create_admin(session_factory)
    login(client, "admin@platform.example.com")
    assert client.get("/api/jobs").status_code == 403
