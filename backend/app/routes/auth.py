"""
Authentication routes: register, login, password reset
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
    PasswordResetRequest,
    PasswordReset,
    PasswordChange,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    generate_reset_token,
    RESET_TOKEN_EXPIRE_HOURS,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: Valid email address (must be unique)
    - **password**: Password (minimum 8 characters)
    - **role**: User role (default: "user")
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        role=user_data.role,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        user_id=new_user.user_id,
        email=new_user.email,
        role=new_user.role,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login and get access token.
    
    - **email**: User email
    - **password**: User password
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.user_id), "email": user.email, "role": user.role})
    
    # Update user token (optional - for refresh token storage)
    user.token = access_token
    await db.commit()
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            user_id=user.user_id,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """
    Request password reset. Generates a reset token.
    
    - **email**: User email address
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_password_token = reset_token
    user.reset_password_expires = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    
    await db.commit()
    
    # In production, send email with reset token here
    # For now, we'll return it (remove this in production!)
    return {
        "message": "Password reset token generated",
        "reset_token": reset_token,  # Remove this in production - send via email instead
        "expires_in_hours": RESET_TOKEN_EXPIRE_HOURS
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(reset_data: PasswordReset, db: AsyncSession = Depends(get_db)):
    """
    Reset password using reset token.
    
    - **token**: Password reset token
    - **new_password**: New password (minimum 8 characters)
    """
    # Find user by reset token
    result = await db.execute(
        select(User).where(
            User.reset_password_token == reset_data.token,
            User.reset_password_expires > datetime.utcnow()
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user.password = get_password_hash(reset_data.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    user.token = None  # Invalidate existing tokens
    
    await db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for authenticated user.
    
    - **current_password**: Current password
    - **new_password**: New password (minimum 8 characters)
    
    Requires authentication. Add JWT token in Authorization header.
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.password = get_password_hash(password_data.new_password)
    current_user.token = None  # Invalidate existing tokens
    
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Requires authentication. Add JWT token in Authorization header.
    """
    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
