"""
FastAPI main entry — Sistem Grading Biji Kakao IoT.
Routes diprefix `/api` agar match Kubernetes ingress di environment dev.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import CORS_ORIGINS, UPLOAD_DIR
from core.database import engine, Base
from db_models import tables  # noqa: F401  (register models on Base)
from routers import auth, settings as settings_router, analyze, camera, transactions, ws
from services.mqtt_service import mqtt_bridge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    logger.info("Starting MQTT bridge...")
    await mqtt_bridge.start()
    yield
    # Shutdown
    logger.info("Stopping MQTT bridge...")
    await mqtt_bridge.stop()
    try:
        from services import camera_service
        camera_service.shutdown()
    except Exception:
        pass


app = FastAPI(title="Kakao Grading IoT API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
def root():
    return {"app": "Kakao Grading IoT", "status": "ok"}


@api_router.get("/health")
def health():
    return {"status": "ok"}


# Mount sub-routers
api_router.include_router(auth.router)
api_router.include_router(settings_router.router)
api_router.include_router(analyze.router)
api_router.include_router(camera.router)
api_router.include_router(transactions.router)
api_router.include_router(ws.router)

app.include_router(api_router)

# Static: serve uploaded/captured images
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
