from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenResponse
from app.schemas.common import APIResponse
from app.security import get_password_hash, verify_password, create_access_token
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
def register_customer(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new customer, hashes their password with bcrypt,
    creates the user in the database, and returns an access token.
    """
    # 1. Check if phone is already registered
    existing_phone = db.query(User).filter(User.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number is already registered",
        )

    # 2. Check if email is already registered (if provided)
    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered",
            )

    # 3. Create new customer user
    new_user = User(
        role="customer",
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.lower().strip() if payload.email else None,
        password_hash=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Generate JWT access token
    token = create_access_token({
        "sub": str(new_user.id),
        "role": new_user.role,
        "phone": new_user.phone,
    })

    return APIResponse(
        success=True,
        message="Registration successful! Welcome to the store.",
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(new_user),
        ),
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Customer or Admin login",
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user via phone number or email address and password.
    Returns a signed JWT access token and user profile details.
    """
    identifier = payload.phone_or_email.strip().lower()

    # Query user by phone or email
    user = db.query(User).filter(
        or_(
            User.phone == payload.phone_or_email.strip(),
            User.email == identifier,
        )
    ).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Generate JWT token with user ID and role
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "phone": user.phone,
    })

    return APIResponse(
        success=True,
        message=f"Welcome back, {user.full_name}!",
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(user),
        ),
    )


@router.get(
    "/me",
    response_model=APIResponse[UserOut],
    status_code=status.HTTP_200_OK,
    summary="Get current logged-in user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's profile details.
    Requires Bearer token in the Authorization header.
    """
    return APIResponse(
        success=True,
        message="User profile fetched successfully",
        data=UserOut.model_validate(current_user),
    )


@router.get(
    "/admin-check",
    response_model=APIResponse[UserOut],
    status_code=status.HTTP_200_OK,
    summary="Verify admin privileges",
)
def admin_check(current_user: User = Depends(require_admin)):
    """
    Protected endpoint to test and verify admin-level permissions.
    """
    return APIResponse(
        success=True,
        message="Admin access confirmed",
        data=UserOut.model_validate(current_user),
    )
