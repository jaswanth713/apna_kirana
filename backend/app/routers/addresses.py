import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.delivery import Address, ServiceablePincode
from app.schemas.address import AddressCreate, AddressUpdate, AddressOut
from app.schemas.common import APIResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/addresses", tags=["Addresses"])


@router.get(
    "",
    response_model=APIResponse[List[AddressOut]],
    status_code=status.HTTP_200_OK,
    summary="List all saved delivery addresses for current customer",
)
def list_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return APIResponse(
        success=True,
        message="Addresses retrieved successfully",
        data=[AddressOut.model_validate(addr) for addr in addresses],
    )


@router.post(
    "",
    response_model=APIResponse[AddressOut],
    status_code=status.HTTP_201_CREATED,
    summary="Add a new delivery address",
)
def create_address(
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Validate that the PIN code is serviceable
    clean_pincode = payload.pincode.strip()
    pincode_obj = (
        db.query(ServiceablePincode)
        .filter(
            ServiceablePincode.pincode == clean_pincode,
            ServiceablePincode.is_active == True,
        )
        .first()
    )
    if not pincode_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PIN Code '{clean_pincode}' is not currently in our serviceable delivery region.",
        )

    # 2. If this is the user's first address, make it default automatically
    existing_count = db.query(Address).filter(Address.user_id == current_user.id).count()
    should_be_default = payload.is_default or (existing_count == 0)

    # 3. If setting as default, unset other defaults
    if should_be_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        recipient_name=payload.recipient_name.strip(),
        phone=payload.phone.strip(),
        address_line=payload.address_line.strip(),
        landmark=payload.landmark.strip() if payload.landmark else None,
        city=payload.city.strip(),
        state=payload.state.strip(),
        pincode=clean_pincode,
        is_default=should_be_default,
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)

    return APIResponse(
        success=True,
        message="Delivery address added successfully",
        data=AddressOut.model_validate(new_address),
    )


@router.get(
    "/{address_id}",
    response_model=APIResponse[AddressOut],
    status_code=status.HTTP_200_OK,
    summary="Get single address by ID",
)
def get_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    return APIResponse(
        success=True,
        message="Address retrieved successfully",
        data=AddressOut.model_validate(address),
    )


@router.put(
    "/{address_id}",
    response_model=APIResponse[AddressOut],
    status_code=status.HTTP_200_OK,
    summary="Update an existing delivery address",
)
def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    # Validate pincode if provided
    if payload.pincode:
        clean_pincode = payload.pincode.strip()
        pincode_obj = (
            db.query(ServiceablePincode)
            .filter(
                ServiceablePincode.pincode == clean_pincode,
                ServiceablePincode.is_active == True,
            )
            .first()
        )
        if not pincode_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PIN Code '{clean_pincode}' is not currently in our serviceable delivery region.",
            )
        address.pincode = clean_pincode

    if payload.is_default is True:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
        address.is_default = True

    if payload.recipient_name is not None:
        address.recipient_name = payload.recipient_name.strip()
    if payload.phone is not None:
        address.phone = payload.phone.strip()
    if payload.address_line is not None:
        address.address_line = payload.address_line.strip()
    if payload.landmark is not None:
        address.landmark = payload.landmark.strip() if payload.landmark else None
    if payload.city is not None:
        address.city = payload.city.strip()
    if payload.state is not None:
        address.state = payload.state.strip()

    db.commit()
    db.refresh(address)

    return APIResponse(
        success=True,
        message="Address updated successfully",
        data=AddressOut.model_validate(address),
    )


@router.delete(
    "/{address_id}",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete a delivery address",
)
def delete_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    db.delete(address)
    db.commit()

    return APIResponse(
        success=True,
        message="Address deleted successfully",
        data={"id": str(address_id), "status": "deleted"},
    )


@router.patch(
    "/{address_id}/default",
    response_model=APIResponse[AddressOut],
    status_code=status.HTTP_200_OK,
    summary="Set address as default",
)
def set_default_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    address.is_default = True
    db.commit()
    db.refresh(address)

    return APIResponse(
        success=True,
        message="Default address updated",
        data=AddressOut.model_validate(address),
    )
