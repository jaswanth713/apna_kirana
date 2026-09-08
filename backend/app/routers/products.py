import math
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, func

from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductStockUpdate,
    ProductOut,
    PaginatedProductList,
    PaginationMeta,
)
from app.schemas.common import APIResponse
from app.dependencies.auth import require_admin
from app.utils.helpers import slugify

router = APIRouter(tags=["Products"])


# ==========================================
# PUBLIC PRODUCT ENDPOINTS
# ==========================================

@router.get(
    "/api/products",
    response_model=APIResponse[PaginatedProductList],
    summary="Browse, search, filter, and paginate products",
)
def list_products(
    search: Optional[str] = Query(None, description="Search term in product name, brand, or description"),
    category: Optional[str] = Query(None, description="Filter by category slug or UUID"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    in_stock: Optional[bool] = Query(None, description="Filter by in-stock availability"),
    featured: Optional[bool] = Query(None, description="Filter featured products for home page"),
    sort: Optional[str] = Query("newest", description="Sorting: 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Returns a paginated list of active products with dynamic search, category filtering,
    effective price boundaries, stock status, and sorting options.
    """
    query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active == True)
    )

    # 1. Punctuation-resilient multi-word search filter (matches name, brand, description, slug)
    if search:
        search_words = [w for w in re.split(r"[\s\',]+", search.strip()) if w]
        for word in search_words:
            term = f"%{word}%"
            query = query.filter(
                or_(
                    Product.name.ilike(term),
                    Product.brand.ilike(term),
                    Product.description.ilike(term),
                    Product.slug.ilike(term),
                )
            )

    # 2. Category filter (by slug or UUID)
    if category:
        try:
            cat_uuid = uuid.UUID(category)
            query = query.filter(Product.category_id == cat_uuid)
        except ValueError:
            query = query.join(Product.category).filter(Category.slug == category.strip())

    # 3. Effective price boundary filters (uses discount_price if available, else regular price)
    effective_price_expr = func.coalesce(Product.discount_price, Product.price)
    if min_price is not None:
        query = query.filter(effective_price_expr >= min_price)
    if max_price is not None:
        query = query.filter(effective_price_expr <= max_price)

    # 4. Stock filter
    if in_stock is True:
        query = query.filter(Product.stock_quantity > 0)
    elif in_stock is False:
        query = query.filter(Product.stock_quantity == 0)

    # 5. Featured filter
    if featured is not None:
        query = query.filter(Product.is_featured == featured)

    # 6. Sorting
    if sort == "price_asc":
        query = query.order_by(effective_price_expr.asc())
    elif sort == "price_desc":
        query = query.order_by(effective_price_expr.desc())
    elif sort == "name_asc":
        query = query.order_by(Product.name.asc())
    elif sort == "name_desc":
        query = query.order_by(Product.name.desc())
    else:  # newest default
        query = query.order_by(Product.created_at.desc())

    # 7. Total count & Pagination calculation
    total_items = query.count()
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()

    items = [ProductOut.model_validate(p) for p in products]

    pagination_meta = PaginationMeta(
        page=page,
        limit=limit,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return APIResponse(
        success=True,
        message=f"Fetched {len(items)} products successfully",
        data=PaginatedProductList(
            items=items,
            pagination=pagination_meta,
        ),
    )


@router.get(
    "/api/products/{id_or_slug}",
    response_model=APIResponse[ProductOut],
    summary="Get single product details by ID or Slug",
)
def get_product(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Retrieves complete product details by UUID or unique slug.
    """
    try:
        prod_uuid = uuid.UUID(id_or_slug)
        product = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == prod_uuid)
            .first()
        )
    except ValueError:
        product = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.slug == id_or_slug)
            .first()
        )

    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found",
        )

    return APIResponse(
        success=True,
        message="Product details retrieved successfully",
        data=ProductOut.model_validate(product),
    )


# ==========================================
# ADMIN PRODUCT MANAGEMENT ENDPOINTS
# ==========================================

@router.get(
    "/api/admin/products",
    response_model=APIResponse[PaginatedProductList],
    summary="List all store products including inactive & low stock (Admin Only)",
)
def list_admin_products(
    search: Optional[str] = Query(None, description="Search term in product name or brand"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category ID"),
    low_stock_only: Optional[bool] = Query(None, description="Filter products with stock <= 5"),
    is_active: Optional[bool] = Query(None, description="Filter by active/inactive"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    query = db.query(Product).options(joinedload(Product.category))

    if search:
        search_words = [w for w in re.split(r"[\s\',]+", search.strip()) if w]
        for word in search_words:
            term = f"%{word}%"
            query = query.filter(
                or_(
                    Product.name.ilike(term),
                    Product.brand.ilike(term),
                    Product.slug.ilike(term),
                )
            )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if low_stock_only:
        query = query.filter(Product.stock_quantity <= 5)

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    total_items = query.count()
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
    offset = (page - 1) * limit
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(limit).all()

    items = [ProductOut.model_validate(p) for p in products]

    return APIResponse(
        success=True,
        message=f"Fetched {len(items)} admin products",
        data=PaginatedProductList(
            items=items,
            pagination=PaginationMeta(
                page=page,
                limit=limit,
                total_items=total_items,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1,
            ),
        ),
    )


@router.post(
    "/api/admin/products",
    response_model=APIResponse[ProductOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (Admin Only)",
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Creates a new product in the store catalog.
    """
    # 1. Verify category exists
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified category_id does not exist",
        )

    # 2. Generate slug if not given
    prod_slug = payload.slug.strip() if payload.slug else slugify(f"{payload.name}-{payload.weight_or_quantity}")

    # Ensure slug uniqueness
    existing_slug = db.query(Product).filter(Product.slug == prod_slug).first()
    if existing_slug:
        prod_slug = f"{prod_slug}-{uuid.uuid4().hex[:4]}"

    product = Product(
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=prod_slug,
        brand=payload.brand.strip() if payload.brand else None,
        description=payload.description,
        price=payload.price,
        discount_price=payload.discount_price,
        image_url=payload.image_url,
        stock_quantity=payload.stock_quantity,
        unit=payload.unit,
        weight_or_quantity=payload.weight_or_quantity,
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        message=f"Product '{product.name}' created successfully",
        data=ProductOut.model_validate(product),
    )


@router.put(
    "/api/admin/products/{product_id}",
    response_model=APIResponse[ProductOut],
    summary="Update product details (Admin Only)",
)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Updates product information, prices, discounts, and active state.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "category_id" in update_data and update_data["category_id"]:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified category_id does not exist",
            )

    if "slug" in update_data and update_data["slug"]:
        new_slug = slugify(update_data["slug"])
        existing = db.query(Product).filter(Product.slug == new_slug, Product.id != product_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slug '{new_slug}' is already taken by another product",
            )
        update_data["slug"] = new_slug

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        message="Product updated successfully",
        data=ProductOut.model_validate(product),
    )


@router.patch(
    "/api/admin/products/{product_id}/stock",
    response_model=APIResponse[ProductOut],
    summary="Update product inventory quantity (Admin Only)",
)
def update_product_stock(
    product_id: uuid.UUID,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Quickly adjusts the in-stock quantity of a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.stock_quantity = payload.stock_quantity
    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        message=f"Stock updated to {product.stock_quantity} units",
        data=ProductOut.model_validate(product),
    )


@router.delete(
    "/api/admin/products/{product_id}",
    response_model=APIResponse[dict],
    summary="Deactivate or delete product (Admin Only)",
)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Soft-deactivates product by setting is_active = False to preserve historical orders.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.is_active = False
    db.commit()

    return APIResponse(
        success=True,
        message=f"Product '{product.name}' has been deactivated",
        data={"id": str(product_id), "is_active": False},
    )
