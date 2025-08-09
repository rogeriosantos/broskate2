from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database.connection import execute_single_query
from app.models.schemas import TokenData

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_username(username: str):
    """Get user from database by username"""
    query = """
    SELECT id, username, email, password_hash, profile_image_url, bio, 
           location, skill_level, favorite_tricks, created_at, is_guest, is_active
    FROM users 
    WHERE username = $1 AND is_active = true
    """
    return await execute_single_query(query, username)


async def get_user_by_id(user_id: int):
    """Get user from database by ID"""
    query = """
    SELECT id, username, email, password_hash, profile_image_url, bio, 
           location, skill_level, favorite_tricks, created_at, is_guest, is_active
    FROM users 
    WHERE id = $1 AND is_active = true
    """
    return await execute_single_query(query, user_id)


async def authenticate_user(username: str, password: str):
    """Authenticate user with username and password"""
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user['password_hash']):
        return False
    return user


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user = Depends(get_current_user)):
    """Get current active user (not guest and active)"""
    if current_user['is_guest'] or not current_user['is_active']:
        raise HTTPException(status_code=400, detail="Inactive or guest user")
    return current_user


def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Optional authentication for endpoints that work with both guests and authenticated users"""
    async def _optional_auth():
        if not credentials:
            return None
        try:
            return await get_current_user(credentials)
        except HTTPException:
            return None
    return _optional_auth