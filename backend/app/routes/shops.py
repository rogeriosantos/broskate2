from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from app.models.schemas import (
    ShopCreate, ShopResponse, ShopUpdate, MembershipCreate, 
    MembershipResponse, MessageResponse
)
from app.utils.auth import get_current_active_user
from app.database.connection import execute_query, execute_single_query, execute_command

router = APIRouter()


@router.get("", response_model=List[ShopResponse])
async def get_shops(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: Optional[float] = Query(None, gt=0)
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
    if latitude is not None and longitude is not None and radius_km is not None:
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
    
    try:
        shops = await execute_query(base_query, *values)
        return [ShopResponse(**dict(shop)) for shop in shops]
    except Exception as e:
        # If there's a DB error, return empty list for now
        return []


@router.post("", response_model=ShopResponse)
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
    
    try:
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
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create shop: {str(e)}"
        )


@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: int):
    """Get shop by ID"""
    query = """
    SELECT s.id, s.name, s.description, s.address, s.latitude, s.longitude,
           s.contact_email, s.website_url, s.logo_url, s.owner_id, s.created_at, s.is_verified
    FROM shops s
    WHERE s.id = $1 AND s.is_active = true
    """
    
    try:
        shop = await execute_single_query(query, shop_id)
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shop not found"
            )
        
        return ShopResponse(**dict(shop))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving shop: {str(e)}"
        )