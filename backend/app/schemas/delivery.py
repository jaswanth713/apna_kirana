from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ServiceablePincodeBase(BaseModel):
    pincode: str = Field(..., min_length=5, max_length=10, description="Postal PIN Code")
    area_name: str = Field(..., min_length=2, max_length=100, description="Locality or Area Name")
    delivery_fee: float = Field(30.00, ge=0, description="Standard delivery fee in INR")
    min_order_amount: float = Field(100.00, ge=0, description="Minimum order subtotal to place order")
    free_delivery_threshold: float = Field(499.00, ge=0, description="Order subtotal for free delivery")
    is_active: bool = True


class ServiceablePincodeCreate(ServiceablePincodeBase):
    pass


class ServiceablePincodeUpdate(BaseModel):
    area_name: Optional[str] = None
    delivery_fee: Optional[float] = Field(None, ge=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    free_delivery_threshold: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ServiceablePincodeOut(ServiceablePincodeBase):
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PincodeCheckResponse(BaseModel):
    is_serviceable: bool
    pincode: str
    area_name: Optional[str] = None
    delivery_fee: Optional[float] = None
    min_order_amount: Optional[float] = None
    free_delivery_threshold: Optional[float] = None
    message: str
