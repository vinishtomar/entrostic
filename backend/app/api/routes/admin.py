import uuid
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import Company, CompanyStatus
from app.schemas.auth import AdminCompanyOut

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _to_out(c: Company) -> AdminCompanyOut:
    contact = min(c.users, key=lambda u: u.created_at, default=None)
    return AdminCompanyOut(
        id=c.id,
        name=c.name,
        slug=c.slug,
        website=c.website,
        status=c.status,
        created_at=c.created_at,
        reviewed_at=c.reviewed_at,
        contact_name=contact.full_name if contact else None,
        contact_email=contact.email if contact else None,
    )


@router.get("/companies", response_model=list[AdminCompanyOut])
def list_companies(
    status_filter: Literal["pending", "approved", "rejected"] | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    stmt = select(Company).options(selectinload(Company.users)).order_by(Company.created_at.desc())
    if status_filter:
        stmt = stmt.where(Company.status == status_filter)
    return [_to_out(c) for c in db.scalars(stmt)]


def _review(company_id: uuid.UUID, new_status: CompanyStatus, db: Session) -> AdminCompanyOut:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found.")
    company.status = new_status
    company.reviewed_at = datetime.now(UTC)
    db.commit()
    db.refresh(company)
    return _to_out(company)


@router.post("/companies/{company_id}/approve", response_model=AdminCompanyOut)
def approve(company_id: uuid.UUID, db: Session = Depends(get_db)):
    return _review(company_id, CompanyStatus.APPROVED, db)


@router.post("/companies/{company_id}/reject", response_model=AdminCompanyOut)
def reject(company_id: uuid.UUID, db: Session = Depends(get_db)):
    return _review(company_id, CompanyStatus.REJECTED, db)
