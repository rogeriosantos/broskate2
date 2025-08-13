from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List


class MediaEntityType(str, Enum):
    """Entity types that can have media"""
    USER = "user"
    SPOT = "spot"
    SHOP = "shop"
    EVENT = "event"


class MediaCategory(str, Enum):
    """Media categories"""
    PROFILE = "profile"
    COVER = "cover"
    GALLERY = "gallery"
    THUMBNAIL = "thumbnail"


class MediaType(str, Enum):
    """Media file types"""
    IMAGE = "image"
    VIDEO = "video"


class MediaUpload(BaseModel):
    """Schema for media upload request"""
    entity_type: MediaEntityType
    entity_id: Optional[int] = None
    category: Optional[MediaCategory] = MediaCategory.GALLERY


class MediaResponse(BaseModel):
    """Schema for media response"""
    id: int
    url: str
    thumbnail_url: Optional[str] = None
    file_type: MediaType
    file_size: int
    file_name: str
    entity_type: MediaEntityType
    entity_id: Optional[int] = None
    category: MediaCategory
    upload_date: datetime
    uploaded_by: int

    class Config:
        from_attributes = True


class MediaListResponse(BaseModel):
    """Schema for media list response"""
    media: List[MediaResponse]
    total: int = 0