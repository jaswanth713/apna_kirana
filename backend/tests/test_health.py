import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "version" in data
    assert data["docs"] == "/docs"
    assert data["health"] == "/api/health"


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "database" in data
    assert data["database"]["connected"] is True
    assert data["database"]["status"] == "healthy"
    assert "latency_ms" in data["database"]
