import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def customer_headers():
    res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "customer@gmail.com", "password": "customer123"},
    )
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def sample_product():
    res = client.get("/api/products?limit=1")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 1
    return items[0]


def test_unserviceable_pincode_address_rejected(customer_headers):
    res = client.post(
        "/api/addresses",
        json={
            "recipient_name": "Test User",
            "phone": "9876543210",
            "address_line": "123 Test Street",
            "city": "Unknown City",
            "state": "Unknown State",
            "pincode": "999999",  # Non-serviceable PIN
        },
        headers=customer_headers,
    )
    assert res.status_code == 400
    assert "not currently in our serviceable delivery region" in res.json()["detail"]


def test_address_crud_and_default(customer_headers):
    # 1. Create valid address with serviceable PIN
    add_res = client.post(
        "/api/addresses",
        json={
            "recipient_name": "Customer Home",
            "phone": "9876543210",
            "address_line": "42 Market Road, Indiranagar",
            "landmark": "Near Metro Pillar 80",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "is_default": True,
        },
        headers=customer_headers,
    )
    assert add_res.status_code == 201
    addr = add_res.json()["data"]
    addr_id = addr["id"]
    assert addr["pincode"] == "560001"
    assert addr["is_default"] is True

    # 2. Get address list
    list_res = client.get("/api/addresses", headers=customer_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 3. Update address
    update_res = client.put(
        f"/api/addresses/{addr_id}",
        json={"recipient_name": "Customer Updated Name"},
        headers=customer_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["recipient_name"] == "Customer Updated Name"


def test_order_creation_empty_cart_fails(customer_headers):
    # Clear cart first
    client.delete("/api/cart", headers=customer_headers)

    # Get valid address
    addr_res = client.get("/api/addresses", headers=customer_headers)
    addr_id = addr_res.json()["data"][0]["id"]

    order_res = client.post(
        "/api/orders",
        json={
            "delivery_address_id": addr_id,
            "payment_method": "COD",
        },
        headers=customer_headers,
    )
    assert order_res.status_code == 400
    assert "cart is empty" in order_res.json()["detail"]


def test_successful_cod_checkout_and_stock_reduction(customer_headers, sample_product):
    # 1. Get address
    addr_res = client.get("/api/addresses", headers=customer_headers)
    addr_id = addr_res.json()["data"][0]["id"]

    # 2. Add product to cart
    prod_id = sample_product["id"]
    initial_stock = sample_product["stock_quantity"]

    client.delete("/api/cart", headers=customer_headers)
    add_cart_res = client.post(
        "/api/cart/items",
        json={"product_id": prod_id, "quantity": 2},
        headers=customer_headers,
    )
    assert add_cart_res.status_code == 201

    # 3. Place COD Order
    order_res = client.post(
        "/api/orders",
        json={
            "delivery_address_id": addr_id,
            "payment_method": "COD",
            "customer_notes": "Please deliver in afternoon",
        },
        headers=customer_headers,
    )
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    order_number = order_data["order_number"]

    assert order_number.startswith("ORD-")
    assert order_data["order_status"] == "CONFIRMED"
    assert order_data["payment_method"] == "COD"
    assert order_data["customer_notes"] == "Please deliver in afternoon"
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 2

    # 4. Verify Cart was cleared
    cart_res = client.get("/api/cart", headers=customer_headers)
    assert cart_res.json()["data"]["items"] == []

    # 5. Verify product stock was decremented
    updated_prod_res = client.get(f"/api/products/{prod_id}")
    new_stock = updated_prod_res.json()["data"]["stock_quantity"]
    assert new_stock == initial_stock - 2

    # 6. Verify GET /api/orders/{id_or_order_number}
    get_by_id = client.get(f"/api/orders/{order_id}", headers=customer_headers)
    assert get_by_id.status_code == 200
    assert get_by_id.json()["data"]["order_number"] == order_number

    get_by_num = client.get(f"/api/orders/{order_number}", headers=customer_headers)
    assert get_by_num.status_code == 200
    assert get_by_num.json()["data"]["id"] == order_id


def test_order_cancellation_and_stock_restoration(customer_headers, sample_product):
    # 1. Get address
    addr_res = client.get("/api/addresses", headers=customer_headers)
    addr_id = addr_res.json()["data"][0]["id"]

    # 2. Add product to cart & place order
    prod_id = sample_product["id"]
    before_order_prod = client.get(f"/api/products/{prod_id}").json()["data"]
    stock_before_order = before_order_prod["stock_quantity"]

    client.delete("/api/cart", headers=customer_headers)
    client.post(
        "/api/cart/items",
        json={"product_id": prod_id, "quantity": 3},
        headers=customer_headers,
    )

    place_res = client.post(
        "/api/orders",
        json={"delivery_address_id": addr_id, "payment_method": "COD"},
        headers=customer_headers,
    )
    assert place_res.status_code == 201
    placed_order = place_res.json()["data"]
    order_num = placed_order["order_number"]

    # Stock should be reduced by 3
    stock_after_order = client.get(f"/api/products/{prod_id}").json()["data"]["stock_quantity"]
    assert stock_after_order == stock_before_order - 3

    # 3. Cancel the order
    cancel_res = client.post(
        f"/api/orders/{order_num}/cancel",
        json={"reason": "Ordered by mistake"},
        headers=customer_headers,
    )
    assert cancel_res.status_code == 200
    cancelled_order = cancel_res.json()["data"]
    assert cancelled_order["order_status"] == "CANCELLED"
    assert cancelled_order["cancellation_reason"] == "Ordered by mistake"

    # 4. Verify stock is restored
    stock_after_cancel = client.get(f"/api/products/{prod_id}").json()["data"]["stock_quantity"]
    assert stock_after_cancel == stock_before_order

    # 5. Attempting to cancel already CANCELLED order returns 400
    repeat_cancel = client.post(
        f"/api/orders/{order_num}/cancel",
        headers=customer_headers,
    )
    assert repeat_cancel.status_code == 400
    assert "cannot be cancelled in its current status 'CANCELLED'" in repeat_cancel.json()["detail"]
