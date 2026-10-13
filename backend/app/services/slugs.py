import re
import secrets
import unicodedata


def slugify(text: str, max_len: int = 60) -> str:
    """'Acme GmbH — Senior Backend Engineer!' -> 'acme-gmbh-senior-backend-engineer'"""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:max_len].rstrip("-") or "x"


def job_slug(company_slug: str, title: str) -> str:
    # Random suffix keeps links unique and unguessable (closed or unlisted jobs can't be enumerated).
    return f"{company_slug}-{slugify(title, 80)}-{secrets.token_hex(3)}"
