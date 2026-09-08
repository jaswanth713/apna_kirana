import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Customer full name")
    phone: str = Field(..., min_length=10, max_length=15, description="Mobile phone number")
    email: Optional[EmailStr] = Field(None, description="Optional email address")
    password: str = Field(..., min_length=6, max_length=100, description="Account password (min 6 characters)")

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        # Strip spaces and hyphens
        cleaned = "".join(c for c in v if c.isalnum() or c == "+")
        if len(cleaned) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        return cleaned


class UserLogin(BaseModel):
    phone_or_email: str = Field(..., description="Mobile phone number or email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserOut(BaseModel):
    id: uuid.UUID
    role: str
    full_name: str
    email: Optional[str] = None
    phone: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
