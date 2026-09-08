from datetime import datetime, timezone
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import check_db_connection
from app.routers import (
    auth_router,
    categories_router,
    products_router,
    delivery_router,
    cart_router,
    addresses_router,
    orders_router,
    admin_router,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="REST API backend for Local/Regional General Store E-Commerce Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for Vercel frontend, preview deployments, and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Application Routers
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(delivery_router)
app.include_router(cart_router)
app.include_router(addresses_router)
app.include_router(orders_router)
app.include_router(admin_router)


@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint for welcome message and API discovery.
    """
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "auth": "/api/auth",
            "categories": "/api/categories",
            "products": "/api/products",
            "delivery": "/api/delivery/check/{pincode}",
            "cart": "/api/cart",
            "addresses": "/api/addresses",
            "orders": "/api/orders",
            "admin": "/api/admin",
        }
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """
    Health check endpoint verifying API server status and Neon PostgreSQL database connectivity.
    """
    db_status = check_db_connection()
    is_healthy = db_status.get("connected", False)
    
    response_data = {
        "success": is_healthy,
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }
    
    if not is_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_data
        )
        
    return response_data
