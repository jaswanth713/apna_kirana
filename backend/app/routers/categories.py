import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import CategoryCreate, CategoryUpdate, CategoryOut
from app.schemas.common import APIResponse
from app.dependencies.auth import require_admin
from app.utils.helpers import slugify

router = APIRouter(tags=["Categories"])


# ==========================================
# PUBLIC CATEGORY ENDPOINTS
# ==========================================

@router.get(
    "/api/categories",
    response_model=APIResponse[List[CategoryOut]],
    summary="List all active categories",
)
def list_categories(db: Session = Depends(get_db)):
    """
    Returns all active store categories ordered by display order and name.
    """
    categories = (
        db.query(Category)
        .filter(Category.is_active == True)
        .order_by(Category.display_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        message="Categories fetched successfully",
        data=[CategoryOut.model_validate(c) for c in categories],
    )


@router.get(
    "/api/categories/{id_or_slug}",
    response_model=APIResponse[CategoryOut],
    summary="Get single category details",
)
def get_category(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Retrieves a category by its UUID or unique slug.
    """
    try:
        cat_uuid = uuid.UUID(id_or_slug)
        category = db.query(Category).filter(Category.id == cat_uuid).first()
    except ValueError:
        category = db.query(Category).filter(Category.slug == id_or_slug).first()

    if not category or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{id_or_slug}' not found",
        )

    return APIResponse(
        success=True,
        message="Category retrieved successfully",
        data=CategoryOut.model_validate(category),
    )


# ==========================================
# ADMIN CATEGORY MANAGEMENT ENDPOINTS
# ==========================================

@router.get(
    "/api/admin/categories",
    response_model=APIResponse[List[CategoryOut]],
    summary="List all categories including inactive (Admin Only)",
)
def list_admin_categories(
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    categories = (
        db.query(Category)
        .order_by(Category.display_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        message="All categories fetched successfully",
        data=[CategoryOut.model_validate(c) for c in categories],
    )


@router.post(
    "/api/admin/categories",
    response_model=APIResponse[CategoryOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (Admin Only)",
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Creates a new category. If slug is not provided, it is generated automatically from the name.
    """
    category_slug = payload.slug.strip() if payload.slug else slugify(payload.name)

    existing = db.query(Category).filter(Category.slug == category_slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A category with slug '{category_slug}' already exists",
        )

    category = Category(
        name=payload.name.strip(),
        slug=category_slug,
        description=payload.description,
        image_url=payload.image_url,
        display_order=payload.display_order,
        is_active=payload.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return APIResponse(
        success=True,
        message="Category created successfully",
        data=CategoryOut.model_validate(category),
    )


@router.put(
    "/api/admin/categories/{category_id}",
    response_model=APIResponse[CategoryOut],
    summary="Update category (Admin Only)",
)
def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Updates an existing category.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"]:
        new_slug = slugify(update_data["slug"])
        existing = db.query(Category).filter(Category.slug == new_slug, Category.id != category_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slug '{new_slug}' is already in use by another category",
            )
        update_data["slug"] = new_slug

    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    return APIResponse(
        success=True,
        message="Category updated successfully",
        data=CategoryOut.model_validate(category),
    )


@router.delete(
    "/api/admin/categories/{category_id}",
    response_model=APIResponse[dict],
    summary="Delete or deactivate category (Admin Only)",
)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Deactivates a category or deletes it if no products are attached.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Check if products exist in category
    products_count = db.query(Product).filter(Product.category_id == category_id).count()
    if products_count > 0:
        # Soft-delete by setting inactive
        category.is_active = False
        db.commit()
        return APIResponse(
            success=True,
            message=f"Category marked inactive because {products_count} product(s) are attached to it",
            data={"id": str(category_id), "status": "deactivated"},
        )

    db.delete(category)
    db.commit()

    return APIResponse(
        success=True,
        message="Category deleted successfully",
        data={"id": str(category_id), "status": "deleted"},
    )
