from __future__ import annotations

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _init_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_images(files: list[UploadFile], folder: str = "petstack/products") -> list[str]:
    """Validate and upload up to 5 images to Cloudinary.

    Returns a list of secure URLs.
    """
    if not files:
        return []
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 images allowed per product.",
        )

    _init_cloudinary()
    urls: list[str] = []

    for file in files:
        # --- MIME check ---
        if file.content_type not in ALLOWED_MIME:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' has unsupported type '{file.content_type}'. "
                       "Allowed: JPEG, PNG, WEBP.",
            )

        # --- Size check ---
        content = await file.read()
        if len(content) > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds the 5 MB size limit.",
            )

        # --- Upload ---
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type="image",
        )
        urls.append(result["secure_url"])

    return urls

async def upload_pdf(content: bytes, folder: str = "petstack/prescriptions") -> str:
    """Upload a generated PDF (in bytes) to Cloudinary.
    
    Returns the secure URL.
    """
    _init_cloudinary()
    
    # Upload PDF as 'image' resource_type so Cloudinary can process it,
    # or 'raw' if we just want to store it. 'image' allows PDF previews, but 'raw' is safer for downloads.
    # We'll use 'raw' as it forces a download usually, or 'image' if we want to display it.
    # Let's use 'image' so it can be previewed in browser.
    result = cloudinary.uploader.upload(
        content,
        folder=folder,
        resource_type="image",
        format="pdf"
    )
    return result["secure_url"]
