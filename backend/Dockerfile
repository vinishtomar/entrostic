FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run as an unprivileged user; uploads go to a mounted volume (UPLOAD_DIR).
RUN useradd --create-home --uid 1000 app && mkdir -p /data/uploads && chown -R app:app /app /data
USER app

ENV PORT=8000 UPLOAD_DIR=/data/uploads
EXPOSE 8000

# Migrations run at start (the database's private network isn't reachable during build).
# An empty --host binds every interface on both IPv4 and IPv6 (a bare "::" would be IPv6-only),
# so Railway's private network reaches us in both legacy (IPv6) and newer environments.
CMD ["sh", "-c", "alembic upgrade head && python -m app.cli bootstrap && exec uvicorn app.main:app --host '' --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
