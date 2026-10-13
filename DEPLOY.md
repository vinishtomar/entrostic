# Deploying Entrostic to Railway

Three Railway services in one project:

```
Browser ──HTTPS──▶ web (Next.js, public domain)
                      │  /api/* forwarded over Railway's private network
                      ▼
                   backend (FastAPI, no public domain) ──▶ Postgres
                      │
                      └─ volume /data  (uploaded CVs)
```

The backend is **not** exposed to the internet. The browser only talks to `web`, which forwards
`/api/*` to the backend. Because of that, the login cookie is first-party and no CORS setup is needed.

## 0. Before you start

- **Create a new Anthropic API key** at console.anthropic.com → API keys, and delete the old one
  (the old one was pasted into a chat). The new one goes only into Railway's variables.
- Push this folder to a **private** GitHub repository. `.gitignore` already excludes `.env`,
  `uploads/`, `.venv/` and `node_modules/`.

## 1. Create the project and database

1. Go to railway.com → **New Project** → **Deploy from GitHub repo** → pick your repo.
2. In the project canvas: **+ Create → Database → PostgreSQL**.

## 2. Backend service

Open the service Railway created from your repo:

**Settings**
- **Service name**: `backend` (the variable references below depend on this exact name)
- **Root Directory**: `/backend` (Railway will find `backend/Dockerfile`)
- **Watch Paths**: `/backend/**`, so it only redeploys when backend code changes
- **Healthcheck Path**: `/api/health`
- **Networking**: do **not** generate a public domain

**Volume**: right-click the service → **Attach volume** → mount path **`/data`**

**Variables** (Raw Editor):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
ANTHROPIC_API_KEY=sk-ant-...your-NEW-key...
PORT=8000
UPLOAD_DIR=/data/uploads
COOKIE_SECURE=true
EXPOSE_DOCS=false
RAILWAY_RUN_UID=0
INITIAL_ADMIN_EMAIL=you@yourdomain.com
INITIAL_ADMIN_NAME=Your Name
INITIAL_ADMIN_PASSWORD=choose-a-long-unique-password
```

- `RAILWAY_RUN_UID=0` is needed because Railway volumes are root-owned.
- The `INITIAL_ADMIN_*` variables create your platform-admin login on first start.

## 3. Website service

**+ Create → GitHub Repo →** the same repo again. Then:

**Settings**
- **Service name**: `web`
- **Root Directory**: `/frontend`
- **Watch Paths**: `/frontend/**`
- **Networking → Generate Domain** (target port **3000**). This is your public URL.

**Variables**:

```
PORT=3000
BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000
```

`BACKEND_URL` is compiled into the build, so if you rename the backend service, redeploy `web`.

## 4. Check it

1. `https://<your-web-domain>/api/health` should return `"status":"ok"`.
2. Sign in at `https://<your-web-domain>/login` with your `INITIAL_ADMIN_*` email and password.
3. **Delete `INITIAL_ADMIN_PASSWORD`** from the backend variables (keeping it there is unnecessary risk).
4. Request access as a test company at `/signup`, approve it in `/admin`, post a job, open its link
   in a private window, and apply with a CV.

Each deploy runs database migrations automatically (`alembic upgrade head` in the backend's start
command).

## Custom domain (later)

`web` service → **Settings → Networking → Custom Domain** → add e.g. `app.yourdomain.com` and
create the CNAME record Railway shows at your DNS provider. Nothing else changes.

## Before inviting real companies and candidates

- **Backups**: enable Postgres backups in Railway, and plan for the CV volume.
- **Abuse protection**: there's no rate limiting yet on login and apply. Add it before going public.
- **Privacy**: publish a privacy notice for candidates (you're processing CVs, which is personal data).
