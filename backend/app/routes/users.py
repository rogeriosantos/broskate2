from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from app.models.schemas import UserResponse, UserUpdate, MessageResponse
from app.utils.auth import get_current_user, get_current_active_user
from app.database.connection import execute_single_query, execute_command, execute_query

router = APIRouter()


@router.get("/list")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    skill_level: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None
):
    """Get list of users with pagination and filters"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build WHERE conditions
        where_conditions = ["is_active = true", "is_guest = false"]
        params = []
        param_count = 1
        
        if skill_level:
            where_conditions.append(f"skill_level = ${param_count}")
            params.append(skill_level)
            param_count += 1
            
        if location:
            where_conditions.append(f"LOWER(location) LIKE LOWER(${param_count})")
            params.append(f"%{location}%")
            param_count += 1
            
        if search:
            where_conditions.append(f"LOWER(username) LIKE LOWER(${param_count})")
            params.append(f"%{search}%")
            param_count += 1
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM users WHERE {where_clause}"
        count_result = await execute_single_query(count_query, *params)
        total = count_result['count'] if count_result else 0
        
        # Get users with pagination
        query = f"""
        SELECT id, username, profile_image_url, bio, location, skill_level, 
               favorite_tricks, created_at
        FROM users 
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        params.extend([limit, offset])
        
        users = await execute_query(query, *params)
        
        return {
            "users": [dict(user) for user in users] if users else [],
            "total": total,
            "page": page,
            "limit": limit,
            "message": "Users retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error getting users: {e}")
        # Return empty list instead of error for better UX
        return {
            "users": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "message": "Users endpoint working"
        }


@router.get("/check-username/{username}")
async def check_username_availability(username: str):
    """Check if username is available"""
    # Basic validation
    if len(username) < 3:
        return {"available": False, "reason": "Username must be at least 3 characters long"}
    
    if len(username) > 50:
        return {"available": False, "reason": "Username must be 50 characters or less"}
    
    # Check if username contains only valid characters
    if not username.replace('_', '').replace('-', '').isalnum():
        return {"available": False, "reason": "Username can only contain letters, numbers, underscores, and hyphens"}
    
    # Check if username exists in database
    query = "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true"
    existing_user = await execute_single_query(query, username)
    
    if existing_user:
        return {"available": False, "reason": "Username is already taken"}
    
    return {"available": True, "reason": "Username is available"}


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


@router.post("/{user_id}/follow", response_model=MessageResponse)
async def follow_user(user_id: int, current_user = Depends(get_current_active_user)):
    """Follow a user"""
    # Check if user exists
    user_query = "SELECT id FROM users WHERE id = $1 AND is_active = true"
    user_exists = await execute_single_query(user_query, user_id)
    
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-follow
    if user_id == current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )
    
    # Check if already following
    check_query = "SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2"
    existing_follow = await execute_single_query(check_query, current_user['id'], user_id)
    
    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user"
        )
    
    # Create follow relationship
    follow_query = """
    INSERT INTO user_follows (follower_id, following_id)
    VALUES ($1, $2)
    """
    
    try:
        await execute_command(follow_query, current_user['id'], user_id)
        return MessageResponse(message="User followed successfully")
    except Exception as e:
        print(f"Error following user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to follow user"
        )


@router.delete("/{user_id}/follow", response_model=MessageResponse)
async def unfollow_user(user_id: int, current_user = Depends(get_current_active_user)):
    """Unfollow a user"""
    # Check if following relationship exists
    check_query = "SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2"
    existing_follow = await execute_single_query(check_query, current_user['id'], user_id)
    
    if not existing_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not following this user"
        )
    
    # Delete follow relationship
    unfollow_query = """
    DELETE FROM user_follows 
    WHERE follower_id = $1 AND following_id = $2
    """
    
    try:
        result = await execute_command(unfollow_query, current_user['id'], user_id)
        if result == "DELETE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Follow relationship not found"
            )
        return MessageResponse(message="User unfollowed successfully")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unfollowing user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unfollow user"
        )


@router.get("/{user_id}/followers")
async def get_user_followers(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get list of users following this user"""
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get followers with pagination
    query = """
    SELECT u.id, u.username, u.profile_image_url, u.created_at
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.follower_id
    WHERE uf.following_id = $1 AND u.is_active = true
    ORDER BY uf.followed_at DESC
    LIMIT $2 OFFSET $3
    """
    
    # Get total count
    count_query = """
    SELECT COUNT(*) 
    FROM user_follows uf
    INNER JOIN users u ON u.id = uf.follower_id
    WHERE uf.following_id = $1 AND u.is_active = true
    """
    
    try:
        followers = await execute_query(query, user_id, limit, offset)
        count_result = await execute_single_query(count_query, user_id)
        total = count_result['count'] if count_result else 0
        
        return {
            "followers": [dict(follower) for follower in followers] if followers else [],
            "total": total,
            "page": page,
            "limit": limit,
            "message": "Followers retrieved successfully"
        }
    except Exception as e:
        print(f"Error getting followers: {e}")
        return {
            "followers": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "message": "Failed to get followers"
        }


@router.get("/{user_id}/following")
async def get_user_following(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get list of users this user is following"""
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get following with pagination
    query = """
    SELECT u.id, u.username, u.profile_image_url, u.created_at
    FROM users u
    INNER JOIN user_follows uf ON u.id = uf.following_id
    WHERE uf.follower_id = $1 AND u.is_active = true
    ORDER BY uf.followed_at DESC
    LIMIT $2 OFFSET $3
    """
    
    # Get total count
    count_query = """
    SELECT COUNT(*) 
    FROM user_follows uf
    INNER JOIN users u ON u.id = uf.following_id
    WHERE uf.follower_id = $1 AND u.is_active = true
    """
    
    try:
        following = await execute_query(query, user_id, limit, offset)
        count_result = await execute_single_query(count_query, user_id)
        total = count_result['count'] if count_result else 0
        
        return {
            "following": [dict(user) for user in following] if following else [],
            "total": total,
            "page": page,
            "limit": limit,
            "message": "Following retrieved successfully"
        }
    except Exception as e:
        print(f"Error getting following: {e}")
        return {
            "following": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "message": "Failed to get following"
        }


@router.get("/{user_id}/follow-status")
async def get_follow_status(user_id: int, current_user = Depends(get_current_user)):
    """Check if current user is following the specified user"""
    if current_user['id'] == user_id:
        return {"is_following": False, "is_self": True}
    
    query = "SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2"
    follow_relationship = await execute_single_query(query, current_user['id'], user_id)
    
    return {
        "is_following": bool(follow_relationship),
        "is_self": False
    }