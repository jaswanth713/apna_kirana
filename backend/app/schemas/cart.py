import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CartItemAdd(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1, le=1000, description="Quantity to add to cart")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=1000, description="New quantity (0 to remove)")


class CartItemProductOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    unit: str
    weight_or_quantity: str
    price: float
    discount_price: Optional[float] = None
    effective_price: float
    stock_quantity: int
    is_in_stock: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CartItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    product: CartItemProductOut
    item_price: float
    item_mrp: float
    item_total: float
    item_mrp_total: float
    item_savings: float
    is_available: bool
    stock_warning: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CartSummary(BaseModel):
    subtotal: float
    mrp_total: float
    discount_savings: float
    delivery_fee: float
    free_delivery_threshold: float = 200.0
    amount_for_free_delivery: float
    final_total: float
    total_items_count: int
    total_unique_items: int
    has_out_of_stock_items: bool


class CartResponse(BaseModel):
    items: List[CartItemOut]
    summary: CartSummary


class CartSyncPayload(BaseModel):
    items: List[CartItemAdd] = Field(default_factory=list, description="Guest cart items to merge")
