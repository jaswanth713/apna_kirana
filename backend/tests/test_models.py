import pytest
from app.database import SessionLocal
from app.models import (
    User,
    Category,
    Product,
    ServiceablePincode,
    Address,
    CartItem,
    Order,
    OrderItem,
)
from app.security import verify_password


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_users_exist_and_passwords_verify(db):
    admin = db.query(User).filter(User.email == "admin@localstore.com").first()
    assert admin is not None
    assert admin.role == "admin"
    assert verify_password("admin123", admin.password_hash) is True

    customer = db.query(User).filter(User.phone == "9876543211").first()
    assert customer is not None
    assert customer.role == "customer"
    assert verify_password("customer123", customer.password_hash) is True


def test_categories_and_products_seeded(db):
    categories = db.query(Category).all()
    assert len(categories) >= 10
    
    products = db.query(Product).all()
    assert len(products) >= 30
    
    # Test a specific product and computed properties
    parle_g = db.query(Product).filter(Product.slug.like("parle-g%")).first()
    assert parle_g is not None
    assert float(parle_g.price) > 0
    assert parle_g.effective_price == float(parle_g.discount_price)
    assert parle_g.is_in_stock is True
    assert parle_g.category is not None


def test_serviceable_pincodes_and_address(db):
    pins = db.query(ServiceablePincode).all()
    assert len(pins) >= 6

    test_pin = db.query(ServiceablePincode).filter(ServiceablePincode.pincode == "560034").first()
    assert test_pin is not None
    assert float(test_pin.delivery_fee) == 25.00
    assert float(test_pin.free_delivery_threshold) == 399.00

    address = db.query(Address).filter(Address.pincode == "560034").first()
    assert address is not None
    assert address.user is not None
    assert address.serviceable_pincode.area_name == "Koramangala 4th Block"
