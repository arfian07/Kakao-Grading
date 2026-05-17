import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

# Database
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./kakao.db",  # Fallback untuk dev cloud; di Pi: mysql+pymysql://user:pass@127.0.0.1/kakao
)

# MQTT (broker lokal user di Pi)
MQTT_BROKER = os.environ.get("MQTT_BROKER", "10.185.226.238")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
MQTT_TOPIC_DATA = os.environ.get("MQTT_TOPIC_DATA", "kakao/weight/data")
MQTT_TOPIC_CONTROL = os.environ.get("MQTT_TOPIC_CONTROL", "kakao/control")

# YOLO
ML_MODEL_PATH = ROOT_DIR / "ml_models" / "best.pt"
YOLO_CONF = float(os.environ.get("YOLO_CONF", "0.25"))
YOLO_IOU = float(os.environ.get("YOLO_IOU", "0.45"))
YOLO_AREA_MIN = int(os.environ.get("YOLO_AREA_MIN", "1500"))
YOLO_AREA_MAX = int(os.environ.get("YOLO_AREA_MAX", "90000"))

# Uploads
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Auth
JWT_SECRET = os.environ.get("JWT_SECRET", "ganti-secret-ini-saat-deploy-prod")
JWT_ALGO = "HS256"
JWT_EXPIRE_HOURS = 12

# CORS
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
