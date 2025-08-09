from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PRO = "pro"


class SpotType(str, Enum):
    PARK = "park"
    STREET = "street"
    BOWL = "bowl"
    VERT = "vert"
    MINI_RAMP = "mini_ramp"
    PLAZA = "plaza"
    STAIRS = "stairs"


class EventType(str, Enum):
    SESSION = "session"
    COMPETITION = "competition"
    DEMO = "demo"
    SALE = "sale"
    MEET = "meet"


class MembershipRole(str, Enum):
    MEMBER = "member"
    TEAM_RIDER = "team_rider"
    ADMIN = "admin"


# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    favorite_tricks: Optional[List[str]] = []


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    favorite_tricks: Optional[List[str]] = None
    profile_image_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    profile_image_url: Optional[str] = None
    created_at: datetime
    is_guest: bool = False

    class Config:
        from_attributes = True


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# Shop schemas
class ShopBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    website_url: Optional[str] = None


class ShopCreate(ShopBase):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class ShopUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class ShopResponse(ShopBase):
    id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = None
    owner_id: int
    created_at: datetime
    is_verified: bool = False

    class Config:
        from_attributes = True


# Skate spot schemas
class SpotBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    spot_type: Optional[SpotType] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    features: Optional[List[str]] = []


class SpotCreate(SpotBase):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class SpotUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    spot_type: Optional[SpotType] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    features: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None


class SpotResponse(SpotBase):
    id: int
    latitude: float
    longitude: float
    image_urls: Optional[List[str]] = []
    added_by_user_id: int
    created_at: datetime
    is_approved: bool = False
    distance: Optional[float] = None  # Distance from user location

    class Config:
        from_attributes = True


# Shop membership schemas
class MembershipCreate(BaseModel):
    shop_id: int


class MembershipResponse(BaseModel):
    id: int
    user_id: int
    shop_id: int
    role: MembershipRole
    joined_at: datetime

    class Config:
        from_attributes = True


# Event schemas
class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    event_type: EventType
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    max_participants: Optional[int] = Field(None, gt=0)


class EventCreate(EventBase):
    shop_id: int


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    max_participants: Optional[int] = Field(None, gt=0)
    image_url: Optional[str] = None


class EventResponse(EventBase):
    id: int
    shop_id: int
    image_url: Optional[str] = None
    created_by_user_id: int
    created_at: datetime
    rsvp_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Check-in schemas
class CheckinCreate(BaseModel):
    spot_id: int
    notes: Optional[str] = None


class CheckinResponse(BaseModel):
    id: int
    user_id: int
    spot_id: int
    checked_in_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# Generic response schemas
class MessageResponse(BaseModel):
    message: str


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool