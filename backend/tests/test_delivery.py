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


def test_serviceable_pincode_check():
    # Valid seeded PIN code (560034 - Koramangala)
    res = client.get("/api/delivery/check/560034")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_serviceable"] is True
    assert data["pincode"] == "560034"
    assert data["delivery_fee"] == 25.00
    assert data["free_delivery_threshold"] == 399.00
    assert "Koramangala" in data["area_name"]


def test_unserviceable_pincode_check():
    # Invalid unserviceable PIN
    res = client.get("/api/delivery/check/999999")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_serviceable"] is False
    assert data["pincode"] == "999999"
    assert "currently don't deliver" in data["message"]


def test_admin_pincode_management(admin_headers, customer_headers):
    # Customer rejected with 403
    cust_res = client.post(
        "/api/admin/pincodes",
        json={"pincode": "560099", "area_name": "Test Area"},
        headers=customer_headers,
    )
    assert cust_res.status_code == 403

    # Admin adds new serviceable PIN code
    new_pin_payload = {
        "pincode": "560099",
        "area_name": "Electronic City Phase 1",
        "delivery_fee": 30.00,
        "min_order_amount": 100.00,
        "free_delivery_threshold": 499.00,
        "is_active": True,
    }
    create_res = client.post(
        "/api/admin/pincodes",
        json=new_pin_payload,
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    assert create_res.json()["data"]["pincode"] == "560099"

    # Verify public check now returns serviceable
    check_res = client.get("/api/delivery/check/560099")
    assert check_res.status_code == 200
    assert check_res.json()["data"]["is_serviceable"] is True
    assert "Electronic City" in check_res.json()["data"]["area_name"]

    # Admin deactivates PIN code
    del_res = client.delete("/api/admin/pincodes/560099", headers=admin_headers)
    assert del_res.status_code == 200

    # Public check now shows unserviceable
    check_after = client.get("/api/delivery/check/560099")
    assert check_after.json()["data"]["is_serviceable"] is False
