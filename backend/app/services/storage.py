"""Validating and saving uploaded CV files."""

import uuid
from pathlib import Path

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# extension -> (canonical MIME type, file signature)
# We check the signature ("magic bytes") rather than trusting the browser's content-type.
ALLOWED_TYPES: dict[str, tuple[str, bytes]] = {
    ".pdf": (PDF_MIME, b"%PDF"),
    ".docx": (DOCX_MIME, b"PK\x03\x04"),
}


class InvalidUpload(ValueError):
    """Raised when an uploaded file is rejected; the message is safe to show the user."""


def validate_cv(filename: str, data: bytes, max_bytes: int) -> tuple[str, str]:
    """Return (extension, mime_type) for an acceptable CV, else raise InvalidUpload."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_TYPES:
        raise InvalidUpload("Only PDF and DOCX files are accepted.")
    if not data:
        raise InvalidUpload("The uploaded file is empty.")
    if len(data) > max_bytes:
        raise InvalidUpload(f"File is too large (max {max_bytes // (1024 * 1024)} MB).")

    mime, signature = ALLOWED_TYPES[ext]
    if not data.startswith(signature):
        raise InvalidUpload(f"File content does not look like a valid {ext} file.")
    return ext, mime


def save_cv(data: bytes, ext: str, upload_dir: Path) -> str:
    """Write the file under a random name (never the user's filename) and return that name."""
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    (upload_dir / stored_name).write_bytes(data)
    return stored_name
