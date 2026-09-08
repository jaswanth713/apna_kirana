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
def sample_products():
    res = client.get("/api/products?limit=5")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 2
    return items


def test_unauthenticated_cart_access():
    res = client.get("/api/cart")
    assert res.status_code == 401


def test_clear_cart_initially(customer_headers):
    res = client.delete("/api/cart", headers=customer_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["items"] == []
    assert data["summary"]["total_items_count"] == 0
    assert data["summary"]["subtotal"] == 0.0
    assert data["summary"]["delivery_fee"] == 0.0
    assert data["summary"]["final_total"] == 0.0


def test_add_item_to_cart_and_get_cart(customer_headers, sample_products):
    product1 = sample_products[0]
    product1_id = product1["id"]

    # 1. Add 2 units of product 1
    add_res = client.post(
        "/api/cart/items",
        json={"product_id": product1_id, "quantity": 2},
        headers=customer_headers,
    )
    assert add_res.status_code == 201
    add_data = add_res.json()["data"]
    assert len(add_data["items"]) >= 1

    item1 = next(item for item in add_data["items"] if item["product_id"] == product1_id)
    assert item1["quantity"] == 2
    assert item1["item_price"] == product1["effective_price"]
    assert item1["item_total"] == round(product1["effective_price"] * 2, 2)
    assert item1["is_available"] is True

    # 2. Add 1 more unit of same product (increment)
    add_again_res = client.post(
        "/api/cart/items",
        json={"product_id": product1_id, "quantity": 1},
        headers=customer_headers,
    )
    assert add_again_res.status_code == 201
    updated_item = next(
        item for item in add_again_res.json()["data"]["items"] if item["product_id"] == product1_id
    )
    assert updated_item["quantity"] == 3

    # 3. GET /api/cart verifies state and server-calculated totals
    get_res = client.get("/api/cart", headers=customer_headers)
    assert get_res.status_code == 200
    cart = get_res.json()["data"]
    assert cart["summary"]["total_items_count"] >= 3
    assert cart["summary"]["subtotal"] >= round(product1["effective_price"] * 3, 2)


def test_cart_calculations_and_delivery_fee(customer_headers, sample_products):
    # Clear cart first
    client.delete("/api/cart", headers=customer_headers)

    product1 = sample_products[0]
    # Add 1 unit
    client.post(
        "/api/cart/items",
        json={"product_id": product1["id"], "quantity": 1},
        headers=customer_headers,
    )

    get_res = client.get("/api/cart", headers=customer_headers)
    cart = get_res.json()["data"]
    summary = cart["summary"]

    # Subtotal check
    assert summary["subtotal"] == product1["effective_price"]
    if summary["subtotal"] < 200.0:
        assert summary["delivery_fee"] == 30.0
        assert summary["amount_for_free_delivery"] == round(200.0 - summary["subtotal"], 2)
        assert summary["final_total"] == round(summary["subtotal"] + 30.0, 2)
    else:
        assert summary["delivery_fee"] == 0.0
        assert summary["amount_for_free_delivery"] == 0.0
        assert summary["final_total"] == summary["subtotal"]


def test_update_cart_item_quantity(customer_headers, sample_products):
    product1 = sample_products[0]
    cart_res = client.get("/api/cart", headers=customer_headers)
    cart_item = next(
        item for item in cart_res.json()["data"]["items"] if item["product_id"] == product1["id"]
    )

    # Update quantity to 4 by item_id
    update_res = client.put(
        f"/api/cart/items/{cart_item['id']}",
        json={"quantity": 4},
        headers=customer_headers,
    )
    assert update_res.status_code == 200
    updated_item = next(
        item for item in update_res.json()["data"]["items"] if item["id"] == cart_item["id"]
    )
    assert updated_item["quantity"] == 4

    # Update quantity by product_id
    update_by_prod = client.put(
        f"/api/cart/items/{product1['id']}",
        json={"quantity": 2},
        headers=customer_headers,
    )
    assert update_by_prod.status_code == 200
    updated_item_2 = next(
        item for item in update_by_prod.json()["data"]["items"] if item["id"] == cart_item["id"]
    )
    assert updated_item_2["quantity"] == 2


def test_delete_cart_item(customer_headers, sample_products):
    product1 = sample_products[0]
    # Delete by product ID
    del_res = client.delete(
        f"/api/cart/items/{product1['id']}",
        headers=customer_headers,
    )
    assert del_res.status_code == 200
    items = del_res.json()["data"]["items"]
    assert not any(item["product_id"] == product1["id"] for item in items)


def test_cart_stock_validation(customer_headers, sample_products):
    product1 = sample_products[0]
    excess_qty = product1["stock_quantity"] + 100

    # Attempting to add quantity greater than stock returns 400 Bad Request
    excess_res = client.post(
        "/api/cart/items",
        json={"product_id": product1["id"], "quantity": excess_qty},
        headers=customer_headers,
    )
    assert excess_res.status_code == 400
    assert "exceeds available stock" in excess_res.json()["detail"]


def test_cart_sync_guest_items(customer_headers, sample_products):
    # Clear cart first
    client.delete("/api/cart", headers=customer_headers)

    sync_payload = {
        "items": [
            {"product_id": sample_products[0]["id"], "quantity": 2},
            {"product_id": sample_products[1]["id"], "quantity": 1},
        ]
    }

    sync_res = client.post(
        "/api/cart/sync",
        json=sync_payload,
        headers=customer_headers,
    )
    assert sync_res.status_code == 200
    cart_data = sync_res.json()["data"]
    assert len(cart_data["items"]) == 2
    assert cart_data["summary"]["total_items_count"] == 3
