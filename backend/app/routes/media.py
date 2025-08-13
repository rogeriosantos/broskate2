from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status

from app.utils.auth import get_current_user
from app.models.media import MediaResponse, MediaListResponse, MediaEntityType, MediaCategory, MediaType
from app.services.cloudinary_service import cloudinary_service

router = APIRouter()

# Maximum file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB


def validate_file_size(file_size: int, media_type: str):
    """Validate file size based on type"""
    max_size = MAX_IMAGE_SIZE if media_type == "image" else MAX_VIDEO_SIZE
    if file_size > max_size:
        max_mb = max_size // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size for {media_type}s is {max_mb}MB"
        )


@router.post("/upload", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    entity_type: MediaEntityType = Form(...),
    entity_id: Optional[int] = Form(None),
    category: MediaCategory = Form(MediaCategory.GALLERY),
    current_user: dict = Depends(get_current_user)
):
    """Upload a media file to Cloudinary"""
    
    # Validate file type
    is_valid, media_type = cloudinary_service.validate_file_type(file.content_type, file.filename)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}"
        )
    
    # Read file content
    content = await file.read()
    validate_file_size(len(content), media_type)
    
    # Upload to Cloudinary
    try:
        if media_type == "image":
            upload_result = await cloudinary_service.upload_image(
                file_content=content,
                filename=file.filename or "upload.jpg",
                folder="broskate",
                entity_type=entity_type.value,
                entity_id=entity_id,
                user_id=current_user["id"]
            )
        else:  # video
            upload_result = await cloudinary_service.upload_video(
                file_content=content,
                filename=file.filename or "upload.mp4",
                folder="broskate",
                entity_type=entity_type.value,
                entity_id=entity_id,
                user_id=current_user["id"]
            )
        
        # Create media record
        media_record = MediaResponse(
            id=int(datetime.now().timestamp()),  # Simple ID generation
            url=upload_result["url"],
            thumbnail_url=upload_result.get("thumbnail_url"),
            file_type=MediaType.IMAGE if media_type == "image" else MediaType.VIDEO,
            file_size=upload_result["bytes"],
            file_name=file.filename or "upload",
            entity_type=entity_type,
            entity_id=entity_id,
            category=category,
            upload_date=datetime.now(),
            uploaded_by=current_user["id"]
        )
        
        return media_record
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload media: {str(e)}"
        )


@router.get("/optimize/{public_id}")
async def get_optimized_media(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = "fit",
    quality: str = "auto:good"
):
    """Get optimized media URL from Cloudinary"""
    try:
        # Remove path separators for security
        safe_public_id = public_id.replace("../", "").replace("..\\", "")
        
        optimized_url = cloudinary_service.get_optimized_url(
            public_id=safe_public_id,
            width=width,
            height=height,
            crop=crop,
            quality=quality
        )
        
        return {"url": optimized_url}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate optimized URL: {str(e)}"
        )


@router.get("", response_model=MediaListResponse)
async def get_media(
    entity_type: Optional[MediaEntityType] = None,
    entity_id: Optional[int] = None,
    category: Optional[MediaCategory] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get media files (simplified implementation)"""
    # For now, return empty list since we don't have database persistence
    # In a real implementation, this would query the database
    return MediaListResponse(media=[], total=0)


@router.delete("/{media_id}")
async def delete_media(
    media_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a media file"""
    # Simplified implementation - in real app would check ownership and delete from DB
    return {"message": "Media deleted successfully"}


@router.post("/upload-multiple", response_model=List[MediaResponse])
async def upload_multiple_media(
    files: List[UploadFile] = File(...),
    entity_type: MediaEntityType = Form(...),
    entity_id: Optional[int] = Form(None),
    category: MediaCategory = Form(MediaCategory.GALLERY),
    current_user: dict = Depends(get_current_user)
):
    """Upload multiple media files to Cloudinary"""
    
    if len(files) > 10:  # Limit to 10 files per request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many files. Maximum 10 files per upload."
        )
    
    uploaded_media = []
    failed_uploads = []
    
    for i, file in enumerate(files):
        try:
            # Validate file type
            is_valid, media_type = cloudinary_service.validate_file_type(file.content_type, file.filename)
            if not is_valid:
                failed_uploads.append(f"File {i+1}: Unsupported file type")
                continue
            
            # Read file content
            content = await file.read()
            validate_file_size(len(content), media_type)
            
            # Upload to Cloudinary
            if media_type == "image":
                upload_result = await cloudinary_service.upload_image(
                    file_content=content,
                    filename=file.filename or f"upload_{i+1}.jpg",
                    folder="broskate",
                    entity_type=entity_type.value,
                    entity_id=entity_id,
                    user_id=current_user["id"]
                )
            else:  # video
                upload_result = await cloudinary_service.upload_video(
                    file_content=content,
                    filename=file.filename or f"upload_{i+1}.mp4",
                    folder="broskate",
                    entity_type=entity_type.value,
                    entity_id=entity_id,
                    user_id=current_user["id"]
                )
            
            # Create media record
            media_record = MediaResponse(
                id=int(datetime.now().timestamp() * 1000) + i,  # Unique IDs
                url=upload_result["url"],
                thumbnail_url=upload_result.get("thumbnail_url"),
                file_type=MediaType.IMAGE if media_type == "image" else MediaType.VIDEO,
                file_size=upload_result["bytes"],
                file_name=file.filename or f"upload_{i+1}",
                entity_type=entity_type,
                entity_id=entity_id,
                category=category,
                upload_date=datetime.now(),
                uploaded_by=current_user["id"]
            )
            
            uploaded_media.append(media_record)
            
        except Exception as e:
            failed_uploads.append(f"File {i+1}: {str(e)}")
            continue
    
    if not uploaded_media:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No files were successfully uploaded. Errors: {'; '.join(failed_uploads)}"
        )
    
    return uploaded_media