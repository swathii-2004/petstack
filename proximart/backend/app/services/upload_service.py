import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.config import settings
from app.utils.validators import validate_file

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

async def upload_to_cloudinary(file: UploadFile, folder: str) -> str:
    validate_file(file)
    
    # Cloudinary upload needs file content
    contents = await file.read()
    
    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        resource_type="auto"
    )
    
    return result.get("secure_url")
