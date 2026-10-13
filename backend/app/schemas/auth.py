import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

from app.core.security import MIN_PASSWORD_LENGTH


class CompanySignup(BaseModel):
    company_name: str = Field(min_length=2, max_length=200)
    website: HttpUrl | None = None
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=200)


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    website: str | None
    status: Literal["pending", "approved", "rejected"]
    created_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: Literal["admin", "recruiter"]
    company: CompanyOut | None


class AdminCompanyOut(CompanyOut):
    """Company as shown to the platform admin, with the requesting user's contact."""

    contact_name: str | None
    contact_email: str | None
    reviewed_at: datetime | None
