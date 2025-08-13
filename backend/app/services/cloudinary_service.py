import os
import logging
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class CloudinaryService:
    """Service for handling file uploads to Cloudinary"""
    
    def __init__(self):
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
        
        self.upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET", "broskate_uploads")
        
        # Verify configuration
        if not all([cloudinary.config().cloud_name, cloudinary.config().api_key, cloudinary.config().api_secret]):
            logger.warning("Cloudinary configuration incomplete. Some features may not work.")
    
    async def upload_image(
        self, 
        file_content: bytes, 
        filename: str,
        folder: str = "broskate",
        entity_type: str = "general",
        entity_id: Optional[int] = None,
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Upload an image to Cloudinary
        
        Args:
            file_content: The file content as bytes
            filename: Original filename
            folder: Cloudinary folder to upload to
            entity_type: Type of entity (user, spot, shop, event)
            entity_id: ID of the entity
            user_id: ID of the user uploading
            
        Returns:
            Dictionary with upload results
        """
        try:
            # Create folder structure
            full_folder = f"{folder}/{entity_type}"
            if entity_id:
                full_folder += f"/{entity_id}"
            
            # Generate public ID
            base_filename = os.path.splitext(filename)[0]
            public_id = f"{full_folder}/{base_filename}_{user_id}_{int(cloudinary.utils.now())}"
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file_content,
                public_id=public_id,
                folder=full_folder,
                resource_type="image",
                quality="auto:good",
                format="auto",
                transformation=[
                    {"width": 1920, "height": 1920, "crop": "limit"},  # Limit max size
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ],
                # Generate multiple sizes
                eager=[
                    {"width": 300, "height": 300, "crop": "fill", "gravity": "auto"},  # Thumbnail
                    {"width": 800, "height": 600, "crop": "fit"},  # Medium
                ],
                tags=[entity_type, f"user_{user_id}"],
                context=f"user_id={user_id}|entity_type={entity_type}|entity_id={entity_id or 'none'}"
            )
            
            logger.info(f"Image uploaded successfully: {upload_result['public_id']}")
            
            return {
                "public_id": upload_result["public_id"],
                "url": upload_result["secure_url"],
                "thumbnail_url": upload_result.get("eager", [{}])[0].get("secure_url"),
                "width": upload_result["width"],
                "height": upload_result["height"],
                "format": upload_result["format"],
                "resource_type": upload_result["resource_type"],
                "bytes": upload_result["bytes"],
                "version": upload_result["version"],
                "created_at": upload_result["created_at"]
            }
            
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}"
            )
    
    async def upload_video(
        self, 
        file_content: bytes, 
        filename: str,
        folder: str = "broskate",
        entity_type: str = "general",
        entity_id: Optional[int] = None,
        user_id: int = None
    ) -> Dict[str, Any]:
        """Upload a video to Cloudinary"""
        try:
            # Create folder structure
            full_folder = f"{folder}/{entity_type}"
            if entity_id:
                full_folder += f"/{entity_id}"
            
            # Generate public ID
            base_filename = os.path.splitext(filename)[0]
            public_id = f"{full_folder}/{base_filename}_{user_id}_{int(cloudinary.utils.now())}"
            
            # Upload video to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file_content,
                public_id=public_id,
                folder=full_folder,
                resource_type="video",
                quality="auto",
                transformation=[
                    {"width": 1280, "height": 720, "crop": "limit"},  # Limit size
                    {"quality": "auto"},
                    {"format": "mp4"}  # Ensure MP4 format
                ],
                # Generate video poster/thumbnail
                eager=[
                    {"width": 400, "height": 300, "crop": "fill", "resource_type": "image", "format": "jpg"}
                ],
                tags=[entity_type, f"user_{user_id}", "video"],
                context=f"user_id={user_id}|entity_type={entity_type}|entity_id={entity_id or 'none'}"
            )
            
            logger.info(f"Video uploaded successfully: {upload_result['public_id']}")
            
            return {
                "public_id": upload_result["public_id"],
                "url": upload_result["secure_url"],
                "thumbnail_url": upload_result.get("eager", [{}])[0].get("secure_url"),
                "width": upload_result.get("width"),
                "height": upload_result.get("height"),
                "duration": upload_result.get("duration"),
                "format": upload_result["format"],
                "resource_type": upload_result["resource_type"],
                "bytes": upload_result["bytes"],
                "version": upload_result["version"],
                "created_at": upload_result["created_at"]
            }
            
        except Exception as e:
            logger.error(f"Cloudinary video upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload video: {str(e)}"
            )
    
    async def delete_media(self, public_id: str, resource_type: str = "image") -> bool:
        """Delete media from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            success = result.get("result") == "ok"
            
            if success:
                logger.info(f"Media deleted successfully: {public_id}")
            else:
                logger.warning(f"Failed to delete media: {public_id} - {result}")
                
            return success
            
        except Exception as e:
            logger.error(f"Cloudinary delete failed: {str(e)}")
            return False
    
    def get_optimized_url(
        self, 
        public_id: str, 
        width: Optional[int] = None,
        height: Optional[int] = None,
        crop: str = "fit",
        quality: str = "auto:good"
    ) -> str:
        """Generate optimized URL for an image"""
        transformations = {"quality": quality}
        
        if width or height:
            transformations.update({
                "width": width,
                "height": height,
                "crop": crop
            })
        
        return cloudinary.utils.cloudinary_url(
            public_id,
            **transformations,
            secure=True
        )[0]
    
    def get_video_thumbnail_url(self, public_id: str, width: int = 400, height: int = 300) -> str:
        """Generate thumbnail URL for a video"""
        return cloudinary.utils.cloudinary_url(
            public_id,
            resource_type="video",
            width=width,
            height=height,
            crop="fill",
            format="jpg",
            secure=True
        )[0]
    
    def validate_file_type(self, content_type: str, filename: str) -> tuple[bool, str]:
        """Validate if file type is supported"""
        # Supported image types
        supported_images = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", 
            "image/webp", "image/bmp", "image/tiff"
        }
        
        # Supported video types  
        supported_videos = {
            "video/mp4", "video/avi", "video/mov", "video/mkv", 
            "video/wmv", "video/flv", "video/webm"
        }
        
        if content_type in supported_images:
            return True, "image"
        elif content_type in supported_videos:
            return True, "video"
        else:
            return False, "unsupported"


# Global instance
cloudinary_service = CloudinaryService()