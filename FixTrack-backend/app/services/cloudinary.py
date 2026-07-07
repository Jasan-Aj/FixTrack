import cloudinary
import cloudinary.uploader

from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)


async def upload_image(file_bytes: bytes, folder: str = "complaints") -> dict:
    result = cloudinary.uploader.upload(file_bytes, folder=folder)
    return {
        "public_id": result["public_id"],
        "secure_url": result["secure_url"],
    }
