from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional

from app.models.schemas import UserResponse, UserUpdate, MessageResponse
from app.utils.auth import get_current_user, get_current_active_user
from app.database.connection import execute_single_query, execute_command

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get current user's profile"""
    return UserResponse(**dict(current_user))


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user = Depends(get_current_active_user)
):
    """Update current user's profile"""
    # Build dynamic update query
    update_fields = []
    values = []
    param_count = 1
    
    if user_update.bio is not None:
        update_fields.append(f"bio = ${param_count}")
        values.append(user_update.bio)
        param_count += 1
    
    if user_update.location is not None:
        update_fields.append(f"location = ${param_count}")
        values.append(user_update.location)
        param_count += 1
    
    if user_update.skill_level is not None:
        update_fields.append(f"skill_level = ${param_count}")
        values.append(user_update.skill_level.value)
        param_count += 1
    
    if user_update.favorite_tricks is not None:
        update_fields.append(f"favorite_tricks = ${param_count}")
        values.append(user_update.favorite_tricks)
        param_count += 1
    
    if user_update.profile_image_url is not None:
        update_fields.append(f"profile_image_url = ${param_count}")
        values.append(user_update.profile_image_url)
        param_count += 1
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Add user ID to values
    values.append(current_user['id'])
    
    query = f"""
    UPDATE users 
    SET {', '.join(update_fields)}
    WHERE id = ${param_count}
    RETURNING id, username, email, profile_image_url, bio, location, 
              skill_level, favorite_tricks, created_at, is_guest
    """
    
    updated_user = await execute_single_query(query, *values)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**dict(updated_user))


@router.get("/{user_id}", response_model=UserResponse)
async def get_public_user_profile(user_id: int):
    """Get public user profile by ID"""
    query = """
    SELECT id, username, profile_image_url, bio, location, skill_level, 
           favorite_tricks, created_at, is_guest
    FROM users 
    WHERE id = $1 AND is_active = true
    """
    
    user = await execute_single_query(query, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**dict(user))


@router.delete("/profile", response_model=MessageResponse)
async def delete_user_account(current_user = Depends(get_current_active_user)):
    """Soft delete user account"""
    query = """
    UPDATE users 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    """
    
    result = await execute_command(query, current_user['id'])
    
    if result == "UPDATE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return MessageResponse(message="Account deleted successfully")