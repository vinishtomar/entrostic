import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.core.security import hash_password, hash_token, new_session_token, verify_password
from app.db.session import get_db
from app.models import Company, CompanyStatus, User, UserRole, UserSession
from app.schemas.auth import CompanySignup, LoginRequest, UserOut
from app.services.slugs import slugify

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: CompanySignup, db: Session = Depends(get_db)) -> dict:
    """A company requests access. It can sign in once a platform admin approves it."""
    email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    slug = slugify(body.company_name)
    while db.scalar(select(Company.id).where(Company.slug == slug)):
        slug = f"{slugify(body.company_name)}-{secrets.token_hex(2)}"

    company = Company(
        name=body.company_name.strip(),
        slug=slug,
        website=str(body.website) if body.website else None,
        status=CompanyStatus.PENDING,
    )
    company.users.append(
        User(
            email=email,
            password_hash=hash_password(body.password),
            full_name=body.full_name.strip(),
            role=UserRole.RECRUITER,
        )
    )
    db.add(company)
    db.commit()
    return {"message": "Request received. You'll be able to sign in once your company is approved."}


@router.post("/login", response_model=UserOut)
def login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not verify_password(user.password_hash if user else None, body.password) or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")

    if user.role == UserRole.RECRUITER:
        if user.company.status == CompanyStatus.PENDING:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your company's access request is still being reviewed.")
        if user.company.status == CompanyStatus.REJECTED:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your company's access request was not approved.")

    now = datetime.now(UTC)
    token, token_hash = new_session_token()
    db.add(UserSession(token_hash=token_hash, user_id=user.id, expires_at=now + timedelta(days=settings.session_days)))
    user.last_login_at = now
    db.commit()

    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_days * 86400,
        httponly=True,  # not readable by JavaScript
        samesite="lax",  # not sent on cross-site POSTs (CSRF protection)
        secure=settings.cookie_secure,
        path="/",
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        db.execute(delete(UserSession).where(UserSession.token_hash == hash_token(token)))
        db.commit()
    response.delete_cookie(settings.session_cookie_name, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
