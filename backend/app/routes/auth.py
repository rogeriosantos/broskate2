from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials

from app.models.schemas import UserCreate, UserResponse, LoginRequest, Token, MessageResponse
from app.utils.auth import (
    authenticate_user, create_access_token, get_password_hash, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.database.connection import execute_single_query, execute_command

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        # Check if username already exists
        existing_user = await execute_single_query(
            "SELECT id FROM users WHERE username = $1", user.username
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists (if provided)
        if user.email:
            existing_email = await execute_single_query(
                "SELECT id FROM users WHERE email = $1", user.email
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Insert new user
        query = """
        INSERT INTO users (username, email, password_hash, bio, location, skill_level, favorite_tricks)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, username, email, profile_image_url, bio, location, skill_level, 
                  favorite_tricks, created_at, is_guest
        """
        
        new_user = await execute_single_query(
            query, 
            user.username, 
            user.email, 
            hashed_password,
            user.bio,
            user.location,
            user.skill_level.value if user.skill_level else None,
            user.favorite_tricks or []
        )
        
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        return UserResponse(**dict(new_user))
        
    except HTTPException:
        # Re-raise HTTP exceptions (validation errors, etc.)
        raise
    except Exception as e:
        # Catch and return detailed database errors for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {type(e).__name__}: {str(e)}"
        )


@router.post("/login")
async def login(user_credentials: LoginRequest):
    """Login user and return JWT token with user info"""
    user = await authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    
    # Return both user and token for mobile app compatibility (updated format)
    return {
        "data": {
            "user": UserResponse(**dict(user)).dict(),
            "token": access_token
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**dict(current_user))


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user = Depends(get_current_user)):
    """Refresh JWT token"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user['username']}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """Logout user (client should discard token)"""
    return MessageResponse(message="Successfully logged out")