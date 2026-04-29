import magic
from fastapi import UploadFile, HTTPException

ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"]
MAX_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file(file: UploadFile) -> None:
    # Check actual MIME type
    # We read a chunk to determine MIME type
    chunk = file.file.read(2048)
    file.file.seek(0)  # Reset cursor
    
    mime_type = magic.from_buffer(chunk, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {mime_type}. Allowed types: {ALLOWED_MIME_TYPES}")
        
    # Check size
    file.file.seek(0, 2)  # Go to end
    size = file.file.tell()
    file.file.seek(0)  # Reset cursor
    
    if size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
