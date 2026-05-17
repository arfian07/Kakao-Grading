"""
YOLO vision service — port langsung dari inference_model.ipynb (file #3).
Class names, colors, area filter, dan rounded-box style identik dengan notebook user.

Lazy import: ultralytics & cv2 di-import di dalam fungsi agar backend tetap start
walaupun library belum terinstall di environment dev.
"""
import logging
from pathlib import Path
from typing import Tuple, Dict, Optional

from core.config import ML_MODEL_PATH, YOLO_CONF, YOLO_IOU, YOLO_AREA_MIN, YOLO_AREA_MAX, UPLOAD_DIR

logger = logging.getLogger(__name__)

# Konfigurasi sesuai notebook
COLORS = {
    "Kakao_Bagus": (24, 126, 54),
    "Kakao_Cacat_Fisik": (160, 233, 255),
    "Cacat_hitam": (40, 115, 245),
    "Kakao_Jamur": (54, 54, 204),
}
DISPLAY_NAMES = {
    "Kakao_Bagus": "Bagus",
    "Kakao_Cacat_Fisik": "Rusak",
    "Cacat_hitam": "Hitam",
    "Kakao_Jamur": "Berjamur",
}

_model = None  # singleton


def get_model():
    """Load YOLO model sekali saja (singleton)."""
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO
    except ImportError as e:
        raise RuntimeError(
            "Library 'ultralytics' belum terinstall. "
            "Run: pip install ultralytics opencv-python-headless"
        ) from e

    if not Path(ML_MODEL_PATH).exists():
        raise FileNotFoundError(
            f"Model best.pt tidak ditemukan di {ML_MODEL_PATH}. "
            f"Salin file model Anda ke {ML_MODEL_PATH.parent}/"
        )
    logger.info("Loading YOLO model dari %s ...", ML_MODEL_PATH)
    _model = YOLO(str(ML_MODEL_PATH))
    logger.info("YOLO model loaded. Classes: %s", _model.names)
    return _model


def _draw_rounded_rect(img, pt1, pt2, color, thickness, r):
    import cv2
    x1, y1 = pt1
    x2, y2 = pt2
    cv2.line(img, (x1 + r, y1), (x2 - r, y1), color, thickness)
    cv2.line(img, (x1 + r, y2), (x2 - r, y2), color, thickness)
    cv2.line(img, (x1, y1 + r), (x1, y2 - r), color, thickness)
    cv2.line(img, (x2, y1 + r), (x2, y2 - r), color, thickness)
    cv2.ellipse(img, (x1 + r, y1 + r), (r, r), 180, 0, 90, color, thickness)
    cv2.ellipse(img, (x2 - r, y1 + r), (r, r), 270, 0, 90, color, thickness)
    cv2.ellipse(img, (x1 + r, y2 - r), (r, r), 90, 0, 90, color, thickness)
    cv2.ellipse(img, (x2 - r, y2 - r), (r, r), 0, 0, 90, color, thickness)


def analyze_image(image_path: str, save_annotated: bool = True) -> Dict:
    """
    Returns:
        {
          "total_beans": int,
          "counts": {"Bagus": n, "Rusak": n, "Hitam": n, "Berjamur": n},
          "annotated_path": str | None
        }
    """
    import cv2

    model = get_model()
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Tidak bisa membaca gambar: {image_path}")

    results = model.predict(source=img, conf=YOLO_CONF, iou=YOLO_IOU, verbose=False)

    total = 0
    counts = {"Bagus": 0, "Rusak": 0, "Hitam": 0, "Berjamur": 0}

    for r in results:
        # Filter berdasarkan area
        keep = []
        for i, box in enumerate(r.boxes.xywh):
            w, h = box[2].item(), box[3].item()
            if YOLO_AREA_MIN < (w * h) < YOLO_AREA_MAX:
                keep.append(i)

        for i in keep:
            box = r.boxes[i]
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cls_id = int(box.cls.item())
            raw_name = model.names[cls_id]
            label_text = DISPLAY_NAMES.get(raw_name, raw_name)
            color = COLORS.get(raw_name, (255, 255, 255))

            total += 1
            counts[label_text] = counts.get(label_text, 0) + 1

            _draw_rounded_rect(img, (x1, y1), (x2, y2), color, 3, 10)

            font = cv2.FONT_HERSHEY_SIMPLEX
            (tw, th), _ = cv2.getTextSize(label_text, font, 0.6, 1)
            cv2.rectangle(img, (x1 + 5, y1 - 20), (x1 + 5 + tw + 10, y1), color, -1)
            cv2.putText(img, label_text, (x1 + 10, y1 - 5),
                        font, 0.6, (255, 255, 255), 1, cv2.LINE_AA)

    annotated_path: Optional[str] = None
    if save_annotated:
        src = Path(image_path)
        out = UPLOAD_DIR / f"{src.stem}_annotated{src.suffix}"
        cv2.imwrite(str(out), img)
        annotated_path = str(out)

    return {
        "total_beans": total,
        "counts": counts,
        "annotated_path": annotated_path,
    }
