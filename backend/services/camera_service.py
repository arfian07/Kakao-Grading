"""
Camera service untuk Pi 4B + Arducam 8MP (CSI ribbon) menggunakan picamera2.
Lazy import → backend tetap start di environment dev tanpa picamera2.
"""
import logging
from datetime import datetime
from pathlib import Path
from core.config import UPLOAD_DIR

logger = logging.getLogger(__name__)

_picam = None


def _ensure_camera():
    global _picam
    if _picam is not None:
        return _picam
    try:
        from picamera2 import Picamera2
    except ImportError as e:
        raise RuntimeError(
            "Library 'picamera2' belum terinstall. "
            "Pi: sudo apt install -y python3-picamera2"
        ) from e

    _picam = Picamera2()
    config = _picam.create_still_configuration(main={"size": (1920, 1080)})
    _picam.configure(config)
    _picam.start()
    logger.info("Picamera2 started (1920x1080)")
    return _picam


def capture_image() -> str:
    """Capture 1 frame ke file, return absolute path."""
    cam = _ensure_camera()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    out = UPLOAD_DIR / f"capture_{ts}.jpg"
    cam.capture_file(str(out))
    logger.info("Captured: %s", out)
    return str(out)


def shutdown():
    global _picam
    if _picam is not None:
        try:
            _picam.stop()
            _picam.close()
        except Exception:
            pass
        _picam = None
