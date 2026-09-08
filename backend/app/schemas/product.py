import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# CATEGORY SCHEMAS
# ==========================================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryOut(CategoryBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PRODUCT SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=300)
    category_id: uuid.UUID
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    discount_price: Optional[float] = Field(None, ge=0)
    image_url: Optional[str] = None
    stock_quantity: int = Field(0, ge=0)
    unit: str = Field("Piece", max_length=50)
    weight_or_quantity: str = Field(..., min_length=1, max_length=50)
    is_featured: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=300)
    category_id: Optional[uuid.UUID] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    discount_price: Optional[float] = Field(None, ge=0)
    image_url: Optional[str] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = None
    weight_or_quantity: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductStockUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0, description="New inventory quantity")


class ProductOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    category: Optional[CategoryOut] = None
    name: str
    slug: str
    brand: Optional[str] = None
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    effective_price: float
    image_url: Optional[str] = None
    stock_quantity: int
    is_in_stock: bool
    unit: str
    weight_or_quantity: str
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedProductList(BaseModel):
    items: List[ProductOut]
    pagination: PaginationMeta
