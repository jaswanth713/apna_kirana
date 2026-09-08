import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def admin_headers():
    res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "admin@localstore.com", "password": "admin123"},
    )
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def customer_headers():
    res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "customer@gmail.com", "password": "customer123"},
    )
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_unauthenticated_admin_rejected():
    res = client.get("/api/admin/metrics")
    assert res.status_code == 401

    orders_res = client.get("/api/admin/orders")
    assert orders_res.status_code == 401


def test_customer_access_to_admin_endpoints_forbidden(customer_headers):
    # Customer gets 403 Forbidden on admin metrics
    metrics_res = client.get("/api/admin/metrics", headers=customer_headers)
    assert metrics_res.status_code == 403

    # Customer gets 403 Forbidden on admin orders
    orders_res = client.get("/api/admin/orders", headers=customer_headers)
    assert orders_res.status_code == 403

    # Customer gets 403 Forbidden on admin customers
    cust_res = client.get("/api/admin/customers", headers=customer_headers)
    assert cust_res.status_code == 403

    # Customer gets 403 Forbidden on admin products
    prod_res = client.get("/api/admin/products", headers=customer_headers)
    assert prod_res.status_code == 403

    # Customer gets 403 Forbidden on admin categories
    cat_res = client.get("/api/admin/categories", headers=customer_headers)
    assert cat_res.status_code == 403


def test_admin_metrics_success(admin_headers):
    res = client.get("/api/admin/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "total_sales" in data
    assert "total_orders" in data
    assert "pending_orders" in data
    assert "delivered_orders" in data
    assert "total_customers" in data
    assert "total_products" in data
    assert "low_stock_products_count" in data
    assert "recent_orders" in data
    assert "low_stock_items" in data
    assert isinstance(data["recent_orders"], list)


def test_admin_orders_list_and_status_update(admin_headers, customer_headers):
    # 1. Admin lists orders
    orders_res = client.get("/api/admin/orders", headers=admin_headers)
    assert orders_res.status_code == 200
    order_data = orders_res.json()["data"]
    assert "items" in order_data
    assert "total" in order_data

    if len(order_data["items"]) > 0:
        first_order = order_data["items"][0]
        order_num = first_order["order_number"]

        # 2. Admin updates order status to PREPARING
        update_res = client.patch(
            f"/api/admin/orders/{order_num}/status",
            json={"order_status": "PREPARING"},
            headers=admin_headers,
        )
        assert update_res.status_code == 200
        assert update_res.json()["data"]["order_status"] == "PREPARING"

        # 3. Admin updates order status to OUT_FOR_DELIVERY
        update_res2 = client.patch(
            f"/api/admin/orders/{order_num}/status",
            json={"order_status": "OUT_FOR_DELIVERY"},
            headers=admin_headers,
        )
        assert update_res2.status_code == 200
        assert update_res2.json()["data"]["order_status"] == "OUT_FOR_DELIVERY"


def test_admin_products_list(admin_headers):
    res = client.get("/api/admin/products?limit=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["items"]) <= 10
    assert data["pagination"]["total_items"] >= 1


def test_admin_categories_list(admin_headers):
    res = client.get("/api/admin/categories", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 10


def test_admin_customers_list(admin_headers):
    res = client.get("/api/admin/customers", headers=admin_headers)
    assert res.status_code == 200
    customers = res.json()["data"]
    assert len(customers) >= 1
    assert any(c["phone"] == "9876543211" or c["phone"] == "9876543210" for c in customers)
