import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class ServiceablePincode(Base):
    __tablename__ = "serviceable_pincodes"

    pincode = Column(String(10), primary_key=True)
    area_name = Column(String(100), nullable=False)
    delivery_fee = Column(Numeric(10, 2), nullable=False, default=30.00)
    min_order_amount = Column(Numeric(10, 2), nullable=False, default=100.00)
    free_delivery_threshold = Column(Numeric(10, 2), nullable=False, default=499.00)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    addresses = relationship("Address", back_populates="serviceable_pincode")

    def __repr__(self):
        return f"<ServiceablePincode {self.pincode} - {self.area_name}>"


class Address(Base):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line = Column(String(300), nullable=False)
    landmark = Column(String(150), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), ForeignKey("serviceable_pincodes.pincode", ondelete="RESTRICT"), nullable=False, index=True)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="addresses")
    serviceable_pincode = relationship("ServiceablePincode", back_populates="addresses")
    orders = relationship("Order", back_populates="delivery_address")

    def __repr__(self):
        return f"<Address {self.recipient_name}, {self.pincode}>"
