from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from app.models.schemas import (
    SpotCreate, SpotResponse, SpotUpdate, CheckinCreate, 
    CheckinResponse, MessageResponse
)
from app.utils.auth import get_current_active_user
from app.database.connection import execute_query, execute_single_query, execute_command

router = APIRouter()


@router.get("/", response_model=List[SpotResponse])
async def get_spots(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: Optional[float] = Query(10, gt=0),
    spot_type: Optional[str] = Query(None),
    difficulty_level: Optional[int] = Query(None, ge=1, le=5),
    approved_only: bool = Query(True)
):
    """Get list of skate spots with filtering options"""
    
    base_query = """
    SELECT s.id, s.name, s.description, s.address, s.latitude, s.longitude,
           s.spot_type, s.difficulty_level, s.features, s.image_urls,
           s.added_by_user_id, s.created_at, s.is_approved
    """
    
    # Add distance calculation if coordinates provided
    if latitude is not None and longitude is not None:
        base_query += f""",
        (
            6371 * acos(
                cos(radians({latitude})) * cos(radians(s.latitude)) *
                cos(radians(s.longitude) - radians({longitude})) +
                sin(radians({latitude})) * sin(radians(s.latitude))
            )
        ) as distance
        """
    else:
        base_query += ", NULL as distance"
    
    base_query += """
    FROM skate_spots s
    WHERE s.is_active = true
    """
    
    values = []
    param_count = 1
    
    # Approval filter
    if approved_only:
        base_query += " AND s.is_approved = true"
    
    # Distance filter
    if latitude is not None and longitude is not None and radius_km:
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
    
    # Spot type filter
    if spot_type:
        base_query += f" AND s.spot_type = ${param_count}"
        values.append(spot_type)
        param_count += 1
    
    # Difficulty filter
    if difficulty_level:
        base_query += f" AND s.difficulty_level = ${param_count}"
        values.append(difficulty_level)
        param_count += 1
    
    # Add ordering and pagination
    if latitude is not None and longitude is not None:
        base_query += " ORDER BY distance ASC"
    else:
        base_query += " ORDER BY s.created_at DESC"
    
    offset = (page - 1) * limit
    base_query += f" LIMIT ${param_count} OFFSET ${param_count + 1}"
    values.extend([limit, offset])
    
    try:
        spots = await execute_query(base_query, *values)
        return [SpotResponse(**dict(spot)) for spot in spots]
    except Exception as e:
        # If there's a DB error, return empty list for now
        return []


@router.post("/", response_model=SpotResponse)
async def create_spot(
    spot: SpotCreate,
    current_user = Depends(get_current_active_user)
):
    """Create a new skate spot"""
    query = """
    INSERT INTO skate_spots (name, description, address, latitude, longitude,
                           spot_type, difficulty_level, features, image_urls, added_by_user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, name, description, address, latitude, longitude,
              spot_type, difficulty_level, features, image_urls,
              added_by_user_id, created_at, is_approved
    """
    
    try:
        new_spot = await execute_single_query(
            query,
            spot.name,
            spot.description, 
            spot.address,
            spot.latitude,
            spot.longitude,
            spot.spot_type,
            spot.difficulty_level,
            spot.features or [],
            spot.image_urls or [],
            current_user['id']
        )
        
        if not new_spot:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create spot"
            )
        
        return SpotResponse(**dict(new_spot))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create spot: {str(e)}"
        )


@router.get("/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: int):
    """Get specific spot by ID"""
    query = """
    SELECT s.id, s.name, s.description, s.address, s.latitude, s.longitude,
           s.spot_type, s.difficulty_level, s.features, s.image_urls,
           s.added_by_user_id, s.created_at, s.is_approved, NULL as distance
    FROM skate_spots s
    WHERE s.id = $1 AND s.is_active = true
    """
    
    try:
        spot = await execute_single_query(query, spot_id)
        if not spot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Spot not found"
            )
        
        return SpotResponse(**dict(spot))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving spot: {str(e)}"
        )


@router.post("/{spot_id}/checkin", response_model=CheckinResponse)
async def checkin_spot(
    spot_id: int,
    checkin: CheckinCreate,
    current_user = Depends(get_current_active_user)
):
    """Check into a skate spot"""
    # Verify spot exists
    spot = await execute_single_query(
        "SELECT id FROM skate_spots WHERE id = $1 AND is_active = true",
        spot_id
    )
    if not spot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spot not found"
        )
    
    query = """
    INSERT INTO spot_checkins (spot_id, user_id, session_notes, rating)
    VALUES ($1, $2, $3, $4)
    RETURNING id, spot_id, user_id, session_notes, rating, created_at
    """
    
    try:
        new_checkin = await execute_single_query(
            query,
            spot_id,
            current_user['id'],
            checkin.session_notes,
            checkin.rating
        )
        
        if not new_checkin:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create checkin"
            )
        
        return CheckinResponse(**dict(new_checkin))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkin: {str(e)}"
        )