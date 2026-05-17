"""Endpoint analisis: YOLO image analysis + Fuzzy grading."""
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from services import vision_service, fuzzy_service
from models.schemas import ImageAnalysisResult, FuzzyRequest, FuzzyResultResponse
from core.config import UPLOAD_DIR
from core.database import get_db
from routers.settings import get_prices

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("/image", response_model=ImageAnalysisResult)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """Upload gambar (atau file hasil capture) → jalankan YOLO best.pt."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus berupa image")

    out = UPLOAD_DIR / f"upload_{file.filename}"
    content = await file.read()
    out.write_bytes(content)

    try:
        result = vision_service.analyze_image(str(out), save_annotated=True)
    except (RuntimeError, FileNotFoundError) as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        logger.exception("YOLO inference error")
        raise HTTPException(500, f"Inference gagal: {e}")

    counts = result["counts"]
    annotated = result["annotated_path"]
    return ImageAnalysisResult(
        total_beans=result["total_beans"],
        good_beans=counts.get("Bagus", 0),
        broken_beans=counts.get("Rusak", 0),
        black_beans=counts.get("Hitam", 0),
        moldy_beans=counts.get("Berjamur", 0),
        image_path=str(out),
        annotated_url=f"/api/uploads/{Path(annotated).name}" if annotated else None,
    )


@router.post("/analyze-path", response_model=ImageAnalysisResult)
def analyze_existing(path: str, db: Session = Depends(get_db)):
    """Alternatif: analisis file yang sudah ada di server (dari /capture)."""
    if not Path(path).exists():
        raise HTTPException(404, "File tidak ditemukan")
    try:
        result = vision_service.analyze_image(path, save_annotated=True)
    except (RuntimeError, FileNotFoundError) as e:
        raise HTTPException(503, str(e))

    counts = result["counts"]
    annotated = result["annotated_path"]
    return ImageAnalysisResult(
        total_beans=result["total_beans"],
        good_beans=counts.get("Bagus", 0),
        broken_beans=counts.get("Rusak", 0),
        black_beans=counts.get("Hitam", 0),
        moldy_beans=counts.get("Berjamur", 0),
        image_path=path,
        annotated_url=f"/api/uploads/{Path(annotated).name}" if annotated else None,
    )


@router.post("/fuzzy", response_model=FuzzyResultResponse)
def run_fuzzy(req: FuzzyRequest, db: Session = Depends(get_db)):
    """Hitung grade & estimasi harga berdasarkan input sensor + image analysis."""
    prices = get_prices(db)
    try:
        result = fuzzy_service.jalankan_sistem_fuzzy(
            weight_g=req.weight_g,
            total_beans=req.total_beans,
            moldy=req.moldy,
            black=req.black,
            defective=req.defective,
            harga_config={
                "mutu_1": prices.mutu_1,
                "mutu_2": prices.mutu_2,
                "mutu_3": prices.mutu_3,
            },
        )
    except Exception as e:
        logger.exception("Fuzzy error")
        raise HTTPException(500, f"Fuzzy gagal: {e}")
    return FuzzyResultResponse(**result)
