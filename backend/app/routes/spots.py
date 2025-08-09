from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from app.models.schemas import (
    SpotCreate, SpotResponse, SpotUpdate, CheckinCreate, 
    CheckinResponse, MessageResponse
)
from app.utils.auth import get_current_active_user, optional_auth
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
    approved_only: bool = Query(True),
    current_user = Depends(optional_auth())
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
    
    spots = await execute_query(base_query, *values)
    
    return [SpotResponse(**dict(spot)) for spot in spots]


@router.post("/", response_model=SpotResponse)
async def create_spot(
    spot: SpotCreate,
    current_user = Depends(get_current_active_user)
):
    """Create a new skate spot"""
    query = """
    INSERT INTO skate_spots (name, description, address, latitude, longitude,
                            spot_type, difficulty_level, features, added_by_user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, name, description, address, latitude, longitude,
              spot_type, difficulty_level, features, image_urls,
              added_by_user_id, created_at, is_approved
    """
    
    new_spot = await execute_single_query(
        query,
        spot.name,
        spot.description,
        spot.address,
        spot.latitude,
        spot.longitude,
        spot.spot_type.value if spot.spot_type else None,
        spot.difficulty_level,
        spot.features or [],
        current_user['id']
    )
    
    if not new_spot:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create spot"
        )
    
    return SpotResponse(**dict(new_spot))


@router.get("/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: int):
    """Get spot by ID"""
    query = """
    SELECT id, name, description, address, latitude, longitude,
           spot_type, difficulty_level, features, image_urls,
           added_by_user_id, created_at, is_approved
    FROM skate_spots 
    WHERE id = $1 AND is_active = true
    """
    
    spot = await execute_single_query(query, spot_id)
    
    if not spot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spot not found"
        )
    
    return SpotResponse(**dict(spot))


@router.get("/nearby", response_model=List[SpotResponse])
async def get_nearby_spots(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5, gt=0, le=50),
    limit: int = Query(10, ge=1, le=50)
):
    """Get spots near specified coordinates"""
    query = """
    SELECT s.id, s.name, s.description, s.address, s.latitude, s.longitude,
           s.spot_type, s.difficulty_level, s.features, s.image_urls,
           s.added_by_user_id, s.created_at, s.is_approved,
           (
               6371 * acos(
                   cos(radians($1)) * cos(radians(s.latitude)) *
                   cos(radians(s.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(s.latitude))
               )
           ) as distance
    FROM skate_spots s
    WHERE s.is_active = true AND s.is_approved = true
    AND (
        6371 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(s.latitude))
        )
    ) <= $3
    ORDER BY distance
    LIMIT $4
    """
    
    spots = await execute_query(query, latitude, longitude, radius_km, limit)
    
    return [SpotResponse(**dict(spot)) for spot in spots]


@router.post("/{spot_id}/checkin", response_model=CheckinResponse)
async def checkin_at_spot(
    spot_id: int,
    checkin: CheckinCreate,
    current_user = Depends(get_current_active_user)
):
    """Check in at a skate spot"""
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
    
    # Create check-in
    query = """
    INSERT INTO spot_checkins (user_id, spot_id, notes)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, spot_id, checked_in_at, notes
    """
    
    new_checkin = await execute_single_query(
        query, 
        current_user['id'], 
        spot_id, 
        checkin.notes
    )
    
    return CheckinResponse(**dict(new_checkin))


@router.get("/{spot_id}/checkins", response_model=List[CheckinResponse])
async def get_spot_checkins(
    spot_id: int,
    limit: int = Query(20, ge=1, le=100)
):
    """Get recent check-ins at a spot"""
    query = """
    SELECT sc.id, sc.user_id, sc.spot_id, sc.checked_in_at, sc.notes
    FROM spot_checkins sc
    WHERE sc.spot_id = $1
    ORDER BY sc.checked_in_at DESC
    LIMIT $2
    """
    
    checkins = await execute_query(query, spot_id, limit)
    
    return [CheckinResponse(**dict(checkin)) for checkin in checkins]