import uuid
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


# ==========================================
# PUBLIC CATEGORY & PRODUCT TESTS
# ==========================================

def test_get_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 10

    # Test get category by slug
    first_cat = data["data"][0]
    single_res = client.get(f"/api/categories/{first_cat['slug']}")
    assert single_res.status_code == 200
    assert single_res.json()["data"]["name"] == first_cat["name"]


def test_get_products_pagination():
    response = client.get("/api/products?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) == 10
    pagination = data["data"]["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 10
    assert pagination["total_items"] >= 30
    assert pagination["total_pages"] >= 3
    assert pagination["has_next"] is True


def test_product_search():
    response = client.get("/api/products?search=lays")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 1
    assert any("Lay's" in item["name"] or "Lay's" in (item["brand"] or "") for item in items)


def test_product_category_filtering():
    response = client.get("/api/products?category=biscuits-cookies")
    assert response.status_code == 200
    data = response.json()
    items = data["data"]["items"]
    assert len(items) >= 4
    for item in items:
        assert item["category"]["slug"] == "biscuits-cookies"


def test_product_price_sorting():
    # Ascending
    asc_res = client.get("/api/products?sort=price_asc&limit=10")
    assert asc_res.status_code == 200
    asc_items = asc_res.json()["data"]["items"]
    prices_asc = [item["price"] for item in asc_items]
    assert prices_asc == sorted(prices_asc)

    # Descending
    desc_res = client.get("/api/products?sort=price_desc&limit=10")
    assert desc_res.status_code == 200
    desc_items = desc_res.json()["data"]["items"]
    prices_desc = [item["price"] for item in desc_items]
    assert prices_desc == sorted(prices_desc, reverse=True)


def test_product_price_range_filtering():
    response = client.get("/api/products?min_price=20&max_price=50")
    assert response.status_code == 200
    items = response.json()["data"]["items"]
    for item in items:
        price = item["discount_price"] if item["discount_price"] else item["price"]
        assert 20 <= price <= 50


def test_get_product_by_id_and_slug():
    # Get any product from list
    list_res = client.get("/api/products?limit=1")
    first_product = list_res.json()["data"]["items"][0]

    # By UUID
    uuid_res = client.get(f"/api/products/{first_product['id']}")
    assert uuid_res.status_code == 200
    assert uuid_res.json()["data"]["name"] == first_product["name"]

    # By Slug
    slug_res = client.get(f"/api/products/{first_product['slug']}")
    assert slug_res.status_code == 200
    assert slug_res.json()["data"]["id"] == first_product["id"]


# ==========================================
# ADMIN CATEGORY & PRODUCT CRUD TESTS
# ==========================================

def test_admin_category_crud_and_rbac(admin_headers, customer_headers):
    # Customer rejected with 403
    cust_res = client.post(
        "/api/admin/categories",
        json={"name": "Forbidden Category", "display_order": 99},
        headers=customer_headers,
    )
    assert cust_res.status_code == 403

    # Admin creates category
    cat_payload = {
        "name": f"Test Category {uuid.uuid4().hex[:4]}",
        "description": "Category for testing CRUD",
        "display_order": 50,
    }
    create_res = client.post(
        "/api/admin/categories",
        json=cat_payload,
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    created_cat = create_res.json()["data"]
    cat_id = created_cat["id"]

    # Admin updates category
    update_res = client.put(
        f"/api/admin/categories/{cat_id}",
        json={"name": "Updated Test Category Name"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Updated Test Category Name"

    # Admin deletes category
    del_res = client.delete(
        f"/api/admin/categories/{cat_id}",
        headers=admin_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["status"] == "deleted"


def test_admin_product_crud_and_stock(admin_headers, customer_headers):
    # Get a category id
    cat_res = client.get("/api/categories")
    cat_id = cat_res.json()["data"][0]["id"]

    # Customer rejected with 403
    cust_prod_res = client.post(
        "/api/admin/products",
        json={
            "name": "Forbidden Product",
            "category_id": cat_id,
            "price": 99.0,
            "weight_or_quantity": "100g",
        },
        headers=customer_headers,
    )
    assert cust_prod_res.status_code == 403

    # Admin creates product
    prod_payload = {
        "name": f"Admin Seed Product {uuid.uuid4().hex[:4]}",
        "category_id": cat_id,
        "brand": "Store Brand",
        "description": "Premium test item",
        "price": 100.00,
        "discount_price": 85.00,
        "stock_quantity": 25,
        "unit": "Pack",
        "weight_or_quantity": "250g",
        "is_featured": True,
    }
    create_res = client.post(
        "/api/admin/products",
        json=prod_payload,
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    created_prod = create_res.json()["data"]
    prod_id = created_prod["id"]
    assert created_prod["stock_quantity"] == 25
    assert created_prod["effective_price"] == 85.00

    # Admin updates stock quantity
    stock_res = client.patch(
        f"/api/admin/products/{prod_id}/stock",
        json={"stock_quantity": 75},
        headers=admin_headers,
    )
    assert stock_res.status_code == 200
    assert stock_res.json()["data"]["stock_quantity"] == 75

    # Admin updates product price
    price_res = client.put(
        f"/api/admin/products/{prod_id}",
        json={"price": 120.00, "discount_price": 99.00},
        headers=admin_headers,
    )
    assert price_res.status_code == 200
    assert price_res.json()["data"]["price"] == 120.00
    assert price_res.json()["data"]["effective_price"] == 99.00

    # Admin deactivates product
    del_res = client.delete(
        f"/api/admin/products/{prod_id}",
        headers=admin_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["is_active"] is False
