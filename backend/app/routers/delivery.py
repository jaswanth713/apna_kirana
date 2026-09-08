from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import ServiceablePincode
from app.schemas.delivery import (
    ServiceablePincodeCreate,
    ServiceablePincodeUpdate,
    ServiceablePincodeOut,
    PincodeCheckResponse,
)
from app.schemas.common import APIResponse
from app.dependencies.auth import require_admin

router = APIRouter(tags=["Delivery & PIN Codes"])


# ==========================================
# PUBLIC PIN CODE SERVICEABILITY CHECK
# ==========================================

@router.get(
    "/api/delivery/check/{pincode}",
    response_model=APIResponse[PincodeCheckResponse],
    summary="Check if a PIN code is serviceable for regional delivery",
)
def check_pincode_serviceability(pincode: str, db: Session = Depends(get_db)):
    """
    Checks if customer's delivery PIN code is within the regional store service area.
    Returns delivery fees, minimum order requirement, and free delivery thresholds.
    """
    cleaned_pin = pincode.strip()
    pin_record = (
        db.query(ServiceablePincode)
        .filter(ServiceablePincode.pincode == cleaned_pin, ServiceablePincode.is_active == True)
        .first()
    )

    if not pin_record:
        return APIResponse(
            success=True,
            message="Location checked",
            data=PincodeCheckResponse(
                is_serviceable=False,
                pincode=cleaned_pin,
                message=f"Sorry, we currently don't deliver to {cleaned_pin}. We are expanding soon!",
            ),
        )

    return APIResponse(
        success=True,
        message="Location is serviceable",
        data=PincodeCheckResponse(
            is_serviceable=True,
            pincode=pin_record.pincode,
            area_name=pin_record.area_name,
            delivery_fee=float(pin_record.delivery_fee),
            min_order_amount=float(pin_record.min_order_amount),
            free_delivery_threshold=float(pin_record.free_delivery_threshold),
            message=f"Delivery available in {pin_record.area_name}! Free delivery above ₹{pin_record.free_delivery_threshold:.0f}",
        ),
    )


# ==========================================
# ADMIN PIN CODE MANAGEMENT ENDPOINTS
# ==========================================

@router.get(
    "/api/admin/pincodes",
    response_model=APIResponse[List[ServiceablePincodeOut]],
    summary="List all serviceable PIN codes (Admin Only)",
)
def list_admin_pincodes(
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Returns all configured PIN codes (both active and inactive).
    """
    pincodes = db.query(ServiceablePincode).order_by(ServiceablePincode.pincode.asc()).all()
    return APIResponse(
        success=True,
        message="Serviceable PIN codes fetched successfully",
        data=[ServiceablePincodeOut.model_validate(p) for p in pincodes],
    )


@router.post(
    "/api/admin/pincodes",
    response_model=APIResponse[ServiceablePincodeOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add or update a serviceable PIN code (Admin Only)",
)
def create_or_update_pincode(
    payload: ServiceablePincodeCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Creates or updates regional delivery rules for a postal PIN code.
    """
    cleaned_pin = payload.pincode.strip()
    existing = db.query(ServiceablePincode).filter(ServiceablePincode.pincode == cleaned_pin).first()

    if existing:
        existing.area_name = payload.area_name.strip()
        existing.delivery_fee = payload.delivery_fee
        existing.min_order_amount = payload.min_order_amount
        existing.free_delivery_threshold = payload.free_delivery_threshold
        existing.is_active = payload.is_active
        db.commit()
        db.refresh(existing)
        return APIResponse(
            success=True,
            message=f"PIN code {cleaned_pin} updated successfully",
            data=ServiceablePincodeOut.model_validate(existing),
        )

    new_pin = ServiceablePincode(
        pincode=cleaned_pin,
        area_name=payload.area_name.strip(),
        delivery_fee=payload.delivery_fee,
        min_order_amount=payload.min_order_amount,
        free_delivery_threshold=payload.free_delivery_threshold,
        is_active=payload.is_active,
    )
    db.add(new_pin)
    db.commit()
    db.refresh(new_pin)

    return APIResponse(
        success=True,
        message=f"Serviceable PIN code {cleaned_pin} added successfully",
        data=ServiceablePincodeOut.model_validate(new_pin),
    )


@router.delete(
    "/api/admin/pincodes/{pincode}",
    response_model=APIResponse[dict],
    summary="Deactivate or remove a PIN code (Admin Only)",
)
def delete_pincode(
    pincode: str,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """
    Deactivates a PIN code from regional delivery.
    """
    cleaned_pin = pincode.strip()
    pin = db.query(ServiceablePincode).filter(ServiceablePincode.pincode == cleaned_pin).first()
    if not pin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PIN code not found",
        )

    pin.is_active = False
    db.commit()

    return APIResponse(
        success=True,
        message=f"PIN code {cleaned_pin} has been deactivated",
        data={"pincode": cleaned_pin, "is_active": False},
    )
