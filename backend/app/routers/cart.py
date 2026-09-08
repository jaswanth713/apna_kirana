import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartItemProductOut,
    CartItemOut,
    CartSummary,
    CartResponse,
    CartSyncPayload,
)
from app.schemas.common import APIResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Cart"])

FREE_DELIVERY_THRESHOLD = 200.0
STANDARD_DELIVERY_FEE = 30.0


def calculate_cart_response(cart_items: List[CartItem]) -> CartResponse:
    """
    Computes complete, real-time cart item and summary calculations from database product pricing & inventory.
    """
    item_out_list: List[CartItemOut] = []
    subtotal = 0.0
    mrp_total = 0.0
    total_qty = 0
    has_out_of_stock = False

    for item in cart_items:
        prod = item.product
        if not prod:
            continue

        effective_price = (
            float(prod.discount_price)
            if prod.discount_price is not None and float(prod.discount_price) < float(prod.price)
            else float(prod.price)
        )
        item_mrp = float(prod.price)
        item_tot = round(effective_price * item.quantity, 2)
        item_mrp_tot = round(item_mrp * item.quantity, 2)
        item_sav = round(max(0.0, item_mrp_tot - item_tot), 2)

        is_avail = bool(prod.is_active and prod.stock_quantity >= item.quantity)
        if not is_avail:
            has_out_of_stock = True

        stock_warn: Optional[str] = None
        if not prod.is_active:
            stock_warn = "Item is currently unavailable"
        elif prod.stock_quantity <= 0:
            stock_warn = "Item is out of stock"
        elif prod.stock_quantity < item.quantity:
            stock_warn = f"Only {prod.stock_quantity} left in stock (you requested {item.quantity})"
        elif prod.stock_quantity <= 5:
            stock_warn = f"Only {prod.stock_quantity} left in stock"

        prod_out = CartItemProductOut(
            id=prod.id,
            name=prod.name,
            slug=prod.slug,
            brand=prod.brand,
            image_url=prod.image_url,
            unit=prod.unit,
            weight_or_quantity=prod.weight_or_quantity,
            price=float(prod.price),
            discount_price=float(prod.discount_price) if prod.discount_price is not None else None,
            effective_price=effective_price,
            stock_quantity=prod.stock_quantity,
            is_in_stock=prod.stock_quantity > 0,
            is_active=prod.is_active,
        )

        item_out = CartItemOut(
            id=item.id,
            product_id=prod.id,
            quantity=item.quantity,
            product=prod_out,
            item_price=effective_price,
            item_mrp=item_mrp,
            item_total=item_tot,
            item_mrp_total=item_mrp_tot,
            item_savings=item_sav,
            is_available=is_avail,
            stock_warning=stock_warn,
            updated_at=item.updated_at,
        )
        item_out_list.append(item_out)

        total_qty += item.quantity
        if is_avail:
            subtotal += item_tot
            mrp_total += item_mrp_tot

    subtotal = round(subtotal, 2)
    mrp_total = round(mrp_total, 2)
    discount_savings = round(max(0.0, mrp_total - subtotal), 2)

    delivery_fee = 0.0 if (subtotal >= FREE_DELIVERY_THRESHOLD or subtotal == 0.0) else STANDARD_DELIVERY_FEE
    amount_for_free = 0.0 if subtotal >= FREE_DELIVERY_THRESHOLD else round(FREE_DELIVERY_THRESHOLD - subtotal, 2)
    final_total = round(subtotal + delivery_fee, 2)

    summary = CartSummary(
        subtotal=subtotal,
        mrp_total=mrp_total,
        discount_savings=discount_savings,
        delivery_fee=delivery_fee,
        free_delivery_threshold=FREE_DELIVERY_THRESHOLD,
        amount_for_free_delivery=amount_for_free,
        final_total=final_total,
        total_items_count=total_qty,
        total_unique_items=len(item_out_list),
        has_out_of_stock_items=has_out_of_stock,
    )

    return CartResponse(items=item_out_list, summary=summary)


def get_user_cart_items(db: Session, user_id: uuid.UUID) -> List[CartItem]:
    """Helper to query user's cart items with product relationship eagerly loaded."""
    return (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.updated_at.desc())
        .all()
    )


@router.get(
    "",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Get customer's current cart with real-time totals and stock validation",
)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_items = get_user_cart_items(db, current_user.id)
    cart_data = calculate_cart_response(cart_items)
    return APIResponse(
        success=True,
        message="Cart retrieved successfully",
        data=cart_data,
    )


@router.post(
    "/items",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add an item to customer's cart",
)
def add_to_cart(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Fetch product
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or is currently inactive",
        )

    # 2. Check basic stock
    if product.stock_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{product.name}' is currently out of stock",
        )

    # 3. Check existing cart item for this user & product
    existing_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id,
        )
        .first()
    )

    if existing_item:
        new_quantity = existing_item.quantity + payload.quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add {payload.quantity} more. Maximum {product.stock_quantity} available in stock (you have {existing_item.quantity} in cart).",
            )
        existing_item.quantity = new_quantity
    else:
        if payload.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity {payload.quantity} exceeds available stock of {product.stock_quantity}.",
            )
        new_item = CartItem(
            user_id=current_user.id,
            product_id=product.id,
            quantity=payload.quantity,
        )
        db.add(new_item)

    db.commit()

    # 4. Return updated cart response
    cart_items = get_user_cart_items(db, current_user.id)
    cart_data = calculate_cart_response(cart_items)

    return APIResponse(
        success=True,
        message=f"Added '{product.name}' to your cart",
        data=cart_data,
    )


@router.put(
    "/items/{item_or_product_id}",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Update cart item quantity",
)
def update_cart_item(
    item_or_product_id: str,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_id = uuid.UUID(item_or_product_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for cart item or product",
        )

    # Search by cart_item.id OR cart_item.product_id
    cart_item = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(
            CartItem.user_id == current_user.id,
            (CartItem.id == parsed_id) | (CartItem.product_id == parsed_id),
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in your cart",
        )

    # If quantity is 0, delete the item
    if payload.quantity <= 0:
        db.delete(cart_item)
        db.commit()
        cart_items = get_user_cart_items(db, current_user.id)
        return APIResponse(
            success=True,
            message="Item removed from cart",
            data=calculate_cart_response(cart_items),
        )

    # Check inventory
    product = cart_item.product
    if payload.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity {payload.quantity} exceeds available stock of {product.stock_quantity}.",
        )

    cart_item.quantity = payload.quantity
    db.commit()

    cart_items = get_user_cart_items(db, current_user.id)
    return APIResponse(
        success=True,
        message="Cart updated successfully",
        data=calculate_cart_response(cart_items),
    )


@router.delete(
    "/items/{item_or_product_id}",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Remove an item from customer's cart",
)
def remove_from_cart(
    item_or_product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_id = uuid.UUID(item_or_product_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for cart item or product",
        )

    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            (CartItem.id == parsed_id) | (CartItem.product_id == parsed_id),
        )
        .first()
    )

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in your cart",
        )

    db.delete(cart_item)
    db.commit()

    cart_items = get_user_cart_items(db, current_user.id)
    return APIResponse(
        success=True,
        message="Item removed from cart",
        data=calculate_cart_response(cart_items),
    )


@router.delete(
    "",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Clear entire cart for current customer",
)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()

    empty_response = calculate_cart_response([])
    return APIResponse(
        success=True,
        message="Cart cleared successfully",
        data=empty_response,
    )


@router.post(
    "/sync",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_200_OK,
    summary="Merge guest local cart items into customer account upon login",
)
def sync_cart(
    payload: CartSyncPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for item in payload.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod or not prod.is_active or prod.stock_quantity <= 0:
            continue

        existing = (
            db.query(CartItem)
            .filter(
                CartItem.user_id == current_user.id,
                CartItem.product_id == item.product_id,
            )
            .first()
        )

        desired_qty = item.quantity
        if existing:
            # Maximize without overflowing stock
            new_qty = min(prod.stock_quantity, existing.quantity + desired_qty)
            existing.quantity = new_qty
        else:
            new_qty = min(prod.stock_quantity, desired_qty)
            if new_qty > 0:
                new_cart_item = CartItem(
                    user_id=current_user.id,
                    product_id=prod.id,
                    quantity=new_qty,
                )
                db.add(new_cart_item)

    db.commit()
    cart_items = get_user_cart_items(db, current_user.id)
    return APIResponse(
        success=True,
        message="Cart synchronized successfully",
        data=calculate_cart_response(cart_items),
    )
