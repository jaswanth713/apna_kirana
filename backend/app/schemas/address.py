import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class AddressBase(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=150, description="Full name of recipient")
    phone: str = Field(..., min_length=10, max_length=20, description="Contact phone number")
    address_line: str = Field(..., min_length=5, max_length=300, description="House/Flat number, Street, Area")
    landmark: Optional[str] = Field(None, max_length=150, description="Nearby landmark")
    city: str = Field(..., min_length=2, max_length=100, description="City")
    state: str = Field(..., min_length=2, max_length=100, description="State")
    pincode: str = Field(..., min_length=5, max_length=10, description="6-digit PIN code")
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    address_line: Optional[str] = Field(None, min_length=5, max_length=300)
    landmark: Optional[str] = Field(None, max_length=150)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=5, max_length=10)
    is_default: Optional[bool] = None


class AddressOut(AddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
