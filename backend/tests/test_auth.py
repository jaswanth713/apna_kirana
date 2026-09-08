import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_customer_registration_and_duplicate_prevention():
    random_suffix = uuid.uuid4().hex[:6]
    test_phone = f"91000{random_suffix[:5]}"
    test_email = f"user_{random_suffix}@example.com"
    
    # 1. Successful registration
    reg_payload = {
        "full_name": "Priya Patel",
        "phone": test_phone,
        "email": test_email,
        "password": "securepassword123",
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["phone"] == test_phone
    assert data["data"]["user"]["role"] == "customer"

    # 2. Duplicate phone attempt
    dup_phone_payload = {
        "full_name": "Another Name",
        "phone": test_phone,
        "email": f"diff_{random_suffix}@example.com",
        "password": "anotherpassword",
    }
    dup_res = client.post("/api/auth/register", json=dup_phone_payload)
    assert dup_res.status_code == 400
    assert "mobile number is already registered" in dup_res.json()["detail"]

    # 3. Duplicate email attempt
    dup_email_payload = {
        "full_name": "Another Name",
        "phone": f"92000{random_suffix[:5]}",
        "email": test_email,
        "password": "anotherpassword",
    }
    dup_email_res = client.post("/api/auth/register", json=dup_email_payload)
    assert dup_email_res.status_code == 400
    assert "email address is already registered" in dup_email_res.json()["detail"]


def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"phone_or_email": "nonexistent@store.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_customer_login_via_email_and_phone():
    # Login via email
    res1 = client.post(
        "/api/auth/login",
        json={"phone_or_email": "customer@gmail.com", "password": "customer123"},
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert "access_token" in data1["data"]
    assert data1["data"]["user"]["role"] == "customer"

    # Login via phone
    res2 = client.post(
        "/api/auth/login",
        json={"phone_or_email": "9876543211", "password": "customer123"},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["data"]["user"]["id"] == data1["data"]["user"]["id"]


def test_admin_login():
    res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "admin@localstore.com", "password": "admin123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "admin"
    assert data["data"]["user"]["email"] == "admin@localstore.com"


def test_protected_me_endpoint():
    # 1. Login to get token
    login_res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "customer@gmail.com", "password": "customer123"},
    )
    token = login_res.json()["data"]["access_token"]

    # 2. Access /api/auth/me with valid token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["success"] is True
    assert me_data["data"]["email"] == "customer@gmail.com"
    assert me_data["data"]["role"] == "customer"

    # 3. Access without token should fail
    no_auth_res = client.get("/api/auth/me")
    assert no_auth_res.status_code in [401, 403]


def test_rbac_admin_authorization():
    # Customer token
    cust_res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "customer@gmail.com", "password": "customer123"},
    )
    cust_token = cust_res.json()["data"]["access_token"]

    # Admin token
    admin_res = client.post(
        "/api/auth/login",
        json={"phone_or_email": "admin@localstore.com", "password": "admin123"},
    )
    admin_token = admin_res.json()["data"]["access_token"]

    # Customer tries admin endpoint -> 403 Forbidden
    cust_check = client.get(
        "/api/auth/admin-check",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert cust_check.status_code == 403
    assert "Admin authorization required" in cust_check.json()["detail"]

    # Admin accesses admin endpoint -> 200 OK
    admin_check = client.get(
        "/api/auth/admin-check",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_check.status_code == 200
    assert admin_check.json()["success"] is True
    assert admin_check.json()["data"]["role"] == "admin"
