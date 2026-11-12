import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from ..auth import CurrentUser, get_current_user
from ..config import Settings, get_settings
from ..models import UploadOut

router = APIRouter(prefix="/api", tags=["uploads"])

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
}

# Magic-byte prefixes so a renamed non-image isn't accepted on Content-Type alone.
_SIGNATURES: list[tuple[bytes, int]] = [
    (b"\xff\xd8\xff", 0),  # jpeg
    (b"\x89PNG\r\n\x1a\n", 0),  # png
    (b"GIF8", 0),  # gif
    (b"WEBP", 8),  # webp (RIFF....WEBP)
    (b"ftyp", 4),  # heic / heif
]


def _looks_like_image(head: bytes) -> bool:
    return any(head[off : off + len(sig)] == sig for sig, off in _SIGNATURES)


@router.post("/uploads", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    ext = ALLOWED_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, WebP, GIF or HEIC images are allowed")

    data = await file.read(settings.upload_max_bytes + 1)
    if len(data) > settings.upload_max_bytes:
        raise HTTPException(status_code=413, detail="File too large")
    if not _looks_like_image(data[:16]):
        raise HTTPException(status_code=415, detail="File is not a valid image")

    user_dir = os.path.join(settings.upload_dir, user.uid)
    os.makedirs(user_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(user_dir, filename), "wb") as fh:
        fh.write(data)

    return UploadOut(url=f"{settings.public_upload_path}/{user.uid}/{filename}")
