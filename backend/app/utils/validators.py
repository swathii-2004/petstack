from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

# ── Constants ─────────────────────────────────────────────────────────────────

ALLOWED_MIME_TYPES: frozenset[str] = frozenset(
    {"application/pdf", "image/jpeg", "image/png"}
)
MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB


# ── Public helpers ────────────────────────────────────────────────────────────


async def validate_upload_file(file: UploadFile) -> bytes:
    """Read *file* fully into memory and validate MIME type + size.

    Returns:
        The raw file bytes, ready for upload.

    Raises:
        HTTP 422 – if the content type is not allowed or the file exceeds 5 MB.
    """
    # MIME-type check (relies on the client-supplied Content-Type header;
    # sufficient for a backend gate — a deeper magic-bytes check can be added
    # later if needed).
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"File '{file.filename}' has an unsupported type "
                f"'{file.content_type}'. Allowed types: PDF, JPEG, PNG."
            ),
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"File '{file.filename}' exceeds the 5 MB size limit "
                f"(got {len(content) / (1024 * 1024):.2f} MB)."
            ),
        )

    return content
