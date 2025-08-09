from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from app.models.schemas import (
    ShopCreate, ShopResponse, ShopUpdate, MembershipCreate, 
    MembershipResponse, MessageResponse, PaginationParams
)
from app.utils.auth import get_current_active_user, optional_auth
from app.database.connection import execute_query, execute_single_query, execute_command

router = APIRouter()


@router.get("/", response_model=List[ShopResponse])
async def get_shops(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: Optional[float] = Query(None, gt=0),
    current_user = Depends(optional_auth())
):
    """Get list of shops with optional location filtering"""
    
    base_query = """
    SELECT s.id, s.name, s.description, s.address, s.latitude, s.longitude,
           s.contact_email, s.website_url, s.logo_url, s.owner_id, s.created_at, s.is_verified
    FROM shops s
    WHERE s.is_active = true
    """
    
    values = []
    param_count = 1
    
    # Add location filtering if coordinates provided
    if latitude is not None and longitude is not None:
        if radius_km:
            # Use Haversine formula for distance filtering
            base_query += f"""
            AND (
                6371 * acos(
                    cos(radians(${param_count})) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(${param_count + 1})) +
                    sin(radians(${param_count})) * sin(radians(s.latitude))
                )
            ) <= ${param_count + 2}
            """
            values.extend([latitude, longitude, radius_km])
            param_count += 3
    
    # Add ordering and pagination
    offset = (page - 1) * limit
    base_query += f" ORDER BY s.created_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
    values.extend([limit, offset])
    
    shops = await execute_query(base_query, *values)
    
    return [ShopResponse(**dict(shop)) for shop in shops]


@router.post("/", response_model=ShopResponse)
async def create_shop(
    shop: ShopCreate,
    current_user = Depends(get_current_active_user)
):
    """Create a new shop"""
    query = """
    INSERT INTO shops (name, description, address, latitude, longitude, 
                      contact_email, website_url, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, description, address, latitude, longitude,
              contact_email, website_url, logo_url, owner_id, created_at, is_verified
    """
    
    new_shop = await execute_single_query(
        query,
        shop.name,
        shop.description,
        shop.address,
        shop.latitude,
        shop.longitude,
        shop.contact_email,
        shop.website_url,
        current_user['id']
    )
    
    if not new_shop:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create shop"
        )
    
    return ShopResponse(**dict(new_shop))


@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: int):
    """Get shop by ID"""
    query = """
    SELECT id, name, description, address, latitude, longitude,
           contact_email, website_url, logo_url, owner_id, created_at, is_verified
    FROM shops 
    WHERE id = $1 AND is_active = true
    """
    
    shop = await execute_single_query(query, shop_id)
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    return ShopResponse(**dict(shop))


@router.put("/{shop_id}", response_model=ShopResponse)
async def update_shop(
    shop_id: int,
    shop_update: ShopUpdate,
    current_user = Depends(get_current_active_user)
):
    """Update shop (only owner can update)"""
    # Check if user owns the shop
    owner_check = await execute_single_query(
        "SELECT owner_id FROM shops WHERE id = $1 AND is_active = true",
        shop_id
    )
    
    if not owner_check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    if owner_check['owner_id'] != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this shop"
        )
    
    # Build dynamic update query
    update_fields = []
    values = []
    param_count = 1
    
    for field, value in shop_update.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = ${param_count}")
            values.append(value)
            param_count += 1
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    values.append(shop_id)
    
    query = f"""
    UPDATE shops 
    SET {', '.join(update_fields)}
    WHERE id = ${param_count}
    RETURNING id, name, description, address, latitude, longitude,
              contact_email, website_url, logo_url, owner_id, created_at, is_verified
    """
    
    updated_shop = await execute_single_query(query, *values)
    
    return ShopResponse(**dict(updated_shop))


@router.post("/{shop_id}/join", response_model=MembershipResponse)
async def join_shop(
    shop_id: int,
    current_user = Depends(get_current_active_user)
):
    """Join a shop community"""
    # Check if shop exists
    shop = await execute_single_query(
        "SELECT id FROM shops WHERE id = $1 AND is_active = true",
        shop_id
    )
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    # Check if already a member
    existing_membership = await execute_single_query(
        "SELECT id FROM shop_memberships WHERE user_id = $1 AND shop_id = $2",
        current_user['id'], shop_id
    )
    
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this shop"
        )
    
    # Create membership
    query = """
    INSERT INTO shop_memberships (user_id, shop_id, role)
    VALUES ($1, $2, 'member')
    RETURNING id, user_id, shop_id, role, joined_at
    """
    
    membership = await execute_single_query(query, current_user['id'], shop_id)
    
    return MembershipResponse(**dict(membership))


@router.delete("/{shop_id}/leave", response_model=MessageResponse)
async def leave_shop(
    shop_id: int,
    current_user = Depends(get_current_active_user)
):
    """Leave a shop community"""
    query = """
    DELETE FROM shop_memberships 
    WHERE user_id = $1 AND shop_id = $2
    """
    
    result = await execute_command(query, current_user['id'], shop_id)
    
    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found"
        )
    
    return MessageResponse(message="Successfully left shop community")