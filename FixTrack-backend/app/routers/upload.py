from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.routers.auth import get_current_user
from app.db.models import User
from app.services.cloudinary import upload_image

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("", status_code=status.HTTP_200_OK)
async def upload(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, GIF",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB.",
        )

    try:
        result = await upload_image(contents, folder="complaints")
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}",
        )


@router.post("/batch", status_code=status.HTTP_200_OK)
async def upload_batch(
    files: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
):
    results = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, GIF",
            )

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is 10MB.",
            )

        try:
            result = await upload_image(contents, folder="complaints")
            results.append({"url": result["secure_url"], "public_id": result["public_id"]})
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed for {file.filename}: {str(e)}",
            )

    return results
