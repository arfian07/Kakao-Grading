"""Pi Camera CSI capture endpoint."""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from services import camera_service

router = APIRouter(prefix="/camera", tags=["camera"])


@router.post("/capture")
def capture():
    """Trigger Picamera2 untuk capture 1 frame, simpan ke /uploads, kembalikan path & URL."""
    try:
        path = camera_service.capture_image()
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, f"Capture gagal: {e}")
    return {
        "path": path,
        "url": f"/api/uploads/{Path(path).name}",
    }
