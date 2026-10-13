# Entrostic — Agentic AI Recruitment Platform

Candidates upload CVs → Claude extracts structured profiles → an AI matching agent ranks candidates for job openings with explainable scores.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for requirements, stack, and design, and [DEPLOY.md](DEPLOY.md) for deploying to Railway.

## Quick start (local)

Prerequisites: Docker Desktop (running), Python 3.11+.

```bash
# 1. Config
cp .env.example .env              # add ANTHROPIC_API_KEY when you reach Step 3

# 2. Database (Postgres 17 + pgvector on localhost:5433)
docker compose up -d db

# 3. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head              # create/upgrade database tables
fastapi dev app/main.py           # http://localhost:8000/docs

# 4. Website (new terminal)
cd frontend
npm install
npm run dev                       # http://localhost:3000

# 5. Tests
cd backend && pytest
```

### First-time setup (once)

```bash
cd backend && source .venv/bin/activate
python -m app.cli create-admin --email you@yourdomain.com --name "Your Name"   # platform admin
python -m app.cli seed-demo                                                    # optional demo company + jobs
```

| URL | Who | What |
|---|---|---|
| http://localhost:3000 | Companies | Landing page |
| http://localhost:3000/signup | Companies | Request access (admin must approve) |
| http://localhost:3000/login | Recruiters & admin | Sign in |
| http://localhost:3000/dashboard | Recruiters | Overview, jobs, candidates |
| http://localhost:3000/admin | Platform admin | Approve / reject companies |
| http://localhost:3000/j/&lt;job-slug&gt; | Candidates | Public job page + apply (shareable link) |
| http://localhost:3000/careers/&lt;company-slug&gt; | Candidates | Company careers page |
| http://localhost:8000/docs | Developers | API explorer |

Demo recruiter (after `seed-demo`): `recruiter@example.com` / `northwind-demo-2026`

## Access model

- **Platform admin** – approves companies; sees no applicant data.
- **Recruiter** – belongs to one company; sees only that company's jobs and applicants
  (other companies' IDs return 404).
- **Candidate** – no account; applies via a job link and only ever sees a confirmation.

## Database migrations

After changing a model in `backend/app/models/`:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"   # review the generated file!
alembic upgrade head
```
