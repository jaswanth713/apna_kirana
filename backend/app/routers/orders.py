import uuid
from datetime import datetime, timezone
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.models.delivery import Address, ServiceablePincode
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderCancelRequest, OrderOut, OrderListResponse
from app.schemas.common import APIResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])

FREE_DELIVERY_THRESHOLD = 200.0
STANDARD_DELIVERY_FEE = 30.0


def generate_order_number() -> str:
    """Generates unique, friendly order tracking number: ORD-YYYYMMDD-XXXX"""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_hex = secrets.token_hex(3).upper()
    return f"ORD-{date_str}-{random_hex}"


@router.post(
    "",
    response_model=APIResponse[OrderOut],
    status_code=status.HTTP_201_CREATED,
    summary="Place a new order (Checkout)",
)
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Secure atomic checkout flow:
    1. Validates delivery address ownership and serviceable PIN.
    2. Validates user's cart items, live database product pricing, and stock availability.
    3. Calculates authoritative server totals (subtotal, discounts, delivery fee, final total).
    4. Creates Order + OrderItems, decrements inventory stock, and clears cart in a single transaction.
    """
    # 1. Validate Delivery Address
    address = (
        db.query(Address)
        .filter(Address.id == payload.delivery_address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected delivery address not found in your account.",
        )

    # 2. Validate PIN Code Serviceability
    pincode_obj = (
        db.query(ServiceablePincode)
        .filter(
            ServiceablePincode.pincode == address.pincode,
            ServiceablePincode.is_active == True,
        )
        .first()
    )
    if not pincode_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PIN code '{address.pincode}' is not currently serviceable for deliveries.",
        )

    # 3. Fetch Cart Items
    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Please add products before checking out.",
        )

    # 4. Stock & Price Validation
    subtotal = 0.0
    mrp_total = 0.0
    validated_items_data = []

    for item in cart_items:
        product = item.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name if product else 'Unknown'}' is no longer available. Please update your cart.",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Only {product.stock_quantity} available, but you requested {item.quantity}.",
            )

        # Authoritative price calculation
        effective_price = (
            float(product.discount_price)
            if product.discount_price is not None and float(product.discount_price) < float(product.price)
            else float(product.price)
        )
        item_tot = round(effective_price * item.quantity, 2)
        item_mrp_tot = round(float(product.price) * item.quantity, 2)

        subtotal += item_tot
        mrp_total += item_mrp_tot

        validated_items_data.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": effective_price,
            "total_price": item_tot,
        })

    subtotal = round(subtotal, 2)
    mrp_total = round(mrp_total, 2)
    discount_amount = round(max(0.0, mrp_total - subtotal), 2)

    # Delivery fee calculation
    delivery_fee = 0.0 if subtotal >= FREE_DELIVERY_THRESHOLD else STANDARD_DELIVERY_FEE
    total_amount = round(subtotal + delivery_fee, 2)

    # 5. Atomic Transaction: Create Order, Order Items, Decrement Stock, Clear Cart
    try:
        # Create unique order number
        order_num = generate_order_number()
        while db.query(Order).filter(Order.order_number == order_num).first():
            order_num = generate_order_number()

        new_order = Order(
            order_number=order_num,
            user_id=current_user.id,
            delivery_address_id=address.id,
            subtotal=subtotal,
            discount_amount=discount_amount,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            order_status="CONFIRMED",
            payment_method=payload.payment_method or "COD",
            payment_status="PENDING",
            customer_notes=payload.customer_notes.strip() if payload.customer_notes else None,
        )
        db.add(new_order)
        db.flush()  # Assigns new_order.id

        # Add Order Items & Reduce Product Stock
        for item_data in validated_items_data:
            prod = item_data["product"]
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=prod.id,
                product_name=prod.name,
                product_image=prod.image_url,
                unit_info=f"{prod.brand or ''} {prod.weight_or_quantity}".strip(),
                unit_price=item_data["unit_price"],
                quantity=item_data["quantity"],
                total_price=item_data["total_price"],
            )
            db.add(order_item)

            # Decrement inventory stock
            prod.stock_quantity -= item_data["quantity"]

        # Clear customer's cart
        db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

        db.commit()
        db.refresh(new_order)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your order: {str(e)}",
        )

    # Eager load relationships for response
    full_order = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.delivery_address),
        )
        .filter(Order.id == new_order.id)
        .first()
    )

    return APIResponse(
        success=True,
        message=f"Order {full_order.order_number} placed successfully!",
        data=OrderOut.model_validate(full_order),
    )


@router.get(
    "",
    response_model=APIResponse[List[OrderOut]],
    status_code=status.HTTP_200_OK,
    summary="List all orders for current customer",
)
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.delivery_address),
        )
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return APIResponse(
        success=True,
        message="Orders retrieved successfully",
        data=[OrderOut.model_validate(ord) for ord in orders],
    )


@router.get(
    "/{order_id_or_number}",
    response_model=APIResponse[OrderOut],
    status_code=status.HTTP_200_OK,
    summary="Get single order details by ID or order number",
)
def get_order(
    order_id_or_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.delivery_address),
        )
        .filter(Order.user_id == current_user.id)
    )

    try:
        parsed_uuid = uuid.UUID(order_id_or_number)
        order = query.filter((Order.id == parsed_uuid) | (Order.order_number == order_id_or_number)).first()
    except ValueError:
        order = query.filter(Order.order_number == order_id_or_number).first()

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


@router.post(
    "/{order_id_or_number}/cancel",
    response_model=APIResponse[OrderOut],
    status_code=status.HTTP_200_OK,
    summary="Cancel order and restore product stock",
)
def cancel_order(
    order_id_or_number: str,
    payload: Optional[OrderCancelRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancels an order if it is in PENDING or CONFIRMED state.
    Atomically restores inventory stock quantities in the database.
    """
    query = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.delivery_address),
        )
        .filter(Order.user_id == current_user.id)
    )

    try:
        parsed_uuid = uuid.UUID(order_id_or_number)
        order = query.filter((Order.id == parsed_uuid) | (Order.order_number == order_id_or_number)).first()
    except ValueError:
        order = query.filter(Order.order_number == order_id_or_number).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    cancellable_statuses = ["PENDING", "CONFIRMED"]
    if order.order_status not in cancellable_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled in its current status '{order.order_status}'. Only pending or confirmed orders can be cancelled.",
        )

    try:
        # 1. Restore product stock for each item in order
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock_quantity += item.quantity

        # 2. Update order status and cancellation reason
        order.order_status = "CANCELLED"
        order.cancellation_reason = (
            payload.reason.strip() if (payload and payload.reason) else "Cancelled by customer"
        )
        db.commit()
        db.refresh(order)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(e)}",
        )

    return APIResponse(
        success=True,
        message=f"Order {order.order_number} has been cancelled successfully.",
        data=OrderOut.model_validate(order),
    )
