import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Numeric, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    brand = Column(String(100), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    discount_price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String(500), nullable=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(50), nullable=False, default="Piece")  # 'Pack', 'Bottle', 'Piece', 'kg', 'g'
    weight_or_quantity = Column(String(50), nullable=False)     # '79g', '1L', '500g', 'Pack of 5'
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("Category", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")

    @property
    def effective_price(self) -> float:
        """Returns the discount_price if available and lower than regular price, else regular price."""
        if self.discount_price and float(self.discount_price) < float(self.price):
            return float(self.discount_price)
        return float(self.price)

    @property
    def is_in_stock(self) -> bool:
        return self.stock_quantity > 0

    def __repr__(self):
        return f"<Product {self.name} (Stock: {self.stock_quantity})>"
