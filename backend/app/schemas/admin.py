from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.order import OrderOut
from app.schemas.product import ProductOut


class OrderStatusUpdate(BaseModel):
    order_status: str = Field(..., description="New order status: 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'")
    cancellation_reason: Optional[str] = Field(None, max_length=300, description="Reason if status is CANCELLED")


class DashboardMetrics(BaseModel):
    total_sales: float
    total_orders: int
    pending_orders: int
    delivered_orders: int
    cancelled_orders: int
    total_customers: int
    total_products: int
    low_stock_products_count: int
    recent_orders: List[OrderOut]
    low_stock_items: List[ProductOut]


class AdminCustomerOut(BaseModel):
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    is_active: bool
    total_orders: int
    total_spent: float
    created_at: str
