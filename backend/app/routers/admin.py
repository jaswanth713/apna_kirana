import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.category import Category
from app.schemas.admin import DashboardMetrics, OrderStatusUpdate, AdminCustomerOut
from app.schemas.order import OrderOut, OrderListResponse
from app.schemas.product import ProductOut
from app.schemas.common import APIResponse
from app.dependencies.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


@router.get(
    "/metrics",
    response_model=APIResponse[DashboardMetrics],
    summary="Get store dashboard metrics and recent activity (Admin Only)",
)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Computes store-wide performance metrics: Total Sales, Orders, Customers, Low Stock items, and Recent Orders.
    """
    # 1. Total Sales (sum of non-cancelled orders)
    sales_result = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.order_status != "CANCELLED")
        .scalar()
    )
    total_sales = float(sales_result or 0.0)

    # 2. Orders breakdown
    total_orders = db.query(Order).count()
    pending_orders = (
        db.query(Order)
        .filter(Order.order_status.in_(["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]))
        .count()
    )
    delivered_orders = db.query(Order).filter(Order.order_status == "DELIVERED").count()
    cancelled_orders = db.query(Order).filter(Order.order_status == "CANCELLED").count()

    # 3. Customer and Product counts
    total_customers = db.query(User).filter(User.role == "customer").count()
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # 4. Low stock count (<= 5 units)
    low_stock_query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active == True, Product.stock_quantity <= 5)
        .order_by(Product.stock_quantity.asc())
    )
    low_stock_count = low_stock_query.count()
    low_stock_items = [ProductOut.model_validate(p) for p in low_stock_query.limit(10).all()]

    # 5. Recent 5 orders
    recent_orders_db = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.delivery_address),
        )
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    recent_orders = [OrderOut.model_validate(o) for o in recent_orders_db]

    metrics = DashboardMetrics(
        total_sales=round(total_sales, 2),
        total_orders=total_orders,
        pending_orders=pending_orders,
        delivered_orders=delivered_orders,
        cancelled_orders=cancelled_orders,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_products_count=low_stock_count,
        recent_orders=recent_orders,
        low_stock_items=low_stock_items,
    )

    return APIResponse(
        success=True,
        message="Dashboard metrics computed successfully",
        data=metrics,
    )


@router.get(
    "/orders",
    response_model=APIResponse[OrderListResponse],
    summary="List all store orders with search and status filter (Admin Only)",
)
def list_admin_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
    search: Optional[str] = Query(None, description="Search by order number or customer phone/name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.delivery_address),
    )

    if status_filter and status_filter.strip().upper() != "ALL":
        query = query.filter(Order.order_status == status_filter.strip().upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(Order.user).filter(
            or_(
                Order.order_number.ilike(search_term),
                User.full_name.ilike(search_term),
                User.phone.ilike(search_term),
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()

    return APIResponse(
        success=True,
        message=f"Fetched {len(orders)} orders",
        data=OrderListResponse(
            items=[OrderOut.model_validate(o) for o in orders],
            total=total,
        ),
    )


@router.get(
    "/orders/{id_or_number}",
    response_model=APIResponse[OrderOut],
    summary="Get order details (Admin Only)",
)
def get_admin_order(
    id_or_number: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.delivery_address),
    )
    try:
        parsed_uuid = uuid.UUID(id_or_number)
        order = query.filter((Order.id == parsed_uuid) | (Order.order_number == id_or_number)).first()
    except ValueError:
        order = query.filter(Order.order_number == id_or_number).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return APIResponse(
        success=True,
        message="Order retrieved successfully",
        data=OrderOut.model_validate(order),
    )


@router.patch(
    "/orders/{id_or_number}/status",
    response_model=APIResponse[OrderOut],
    summary="Update order progress status (Admin Only)",
)
def update_order_status(
    id_or_number: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Updates order progress (CONFIRMED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED or CANCELLED).
    Handles inventory restoration if cancelled or deduction if restored.
    """
    valid_statuses = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
    new_status = payload.order_status.strip().upper()

    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid order status '{payload.order_status}'. Must be one of: {', '.join(valid_statuses)}",
        )

    query = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.delivery_address),
    )
    try:
        parsed_uuid = uuid.UUID(id_or_number)
        order = query.filter((Order.id == parsed_uuid) | (Order.order_number == id_or_number)).first()
    except ValueError:
        order = query.filter(Order.order_number == id_or_number).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    old_status = order.order_status

    # If transitioning to CANCELLED from non-cancelled status, restore stock
    if new_status == "CANCELLED" and old_status != "CANCELLED":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity
        order.cancellation_reason = (
            payload.cancellation_reason.strip() if payload.cancellation_reason else "Cancelled by Store Admin"
        )

    # If transitioning from CANCELLED to active status, re-decrement stock
    elif old_status == "CANCELLED" and new_status != "CANCELLED":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity = max(0, product.stock_quantity - item.quantity)
        order.cancellation_reason = None

    order.order_status = new_status
    if new_status == "DELIVERED":
        order.payment_status = "PAID"

    db.commit()
    db.refresh(order)

    return APIResponse(
        success=True,
        message=f"Order {order.order_number} status updated to {new_status}",
        data=OrderOut.model_validate(order),
    )


@router.get(
    "/customers",
    response_model=APIResponse[List[AdminCustomerOut]],
    summary="List all registered customers with spend summary (Admin Only)",
)
def list_admin_customers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customers = (
        db.query(User)
        .filter(User.role == "customer")
        .order_by(User.created_at.desc())
        .all()
    )

    result = []
    for c in customers:
        # Calculate total orders and spend
        orders_query = db.query(Order).filter(Order.user_id == c.id)
        total_ord = orders_query.count()
        total_spent = (
            orders_query.filter(Order.order_status != "CANCELLED")
            .with_entities(func.coalesce(func.sum(Order.total_amount), 0))
            .scalar()
        )

        result.append(
            AdminCustomerOut(
                id=str(c.id),
                full_name=c.full_name,
                phone=c.phone,
                email=c.email,
                role=c.role,
                is_active=c.is_active,
                total_orders=total_ord,
                total_spent=float(total_spent or 0.0),
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
        )

    return APIResponse(
        success=True,
        message=f"Fetched {len(result)} customers",
        data=result,
    )
