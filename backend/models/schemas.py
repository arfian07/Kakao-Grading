"""
Pydantic schemas untuk request/response API.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field


# ---------- AUTH ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "Operator"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


# ---------- SETTINGS (prices) ----------
class PricesResponse(BaseModel):
    mutu_1: float
    mutu_2: float
    mutu_3: float


class PricesUpdate(BaseModel):
    mutu_1: float = Field(ge=0)
    mutu_2: float = Field(ge=0)
    mutu_3: float = Field(ge=0)


# ---------- IMAGE ANALYSIS ----------
class ImageAnalysisResult(BaseModel):
    total_beans: int
    good_beans: int   # Bagus
    broken_beans: int # Rusak
    black_beans: int  # Hitam
    moldy_beans: int  # Berjamur
    image_path: Optional[str] = None
    annotated_url: Optional[str] = None


# ---------- FUZZY ----------
class FuzzyRequest(BaseModel):
    weight_g: float = Field(gt=0)
    total_beans: int = Field(ge=0)
    moldy: int = Field(ge=0)
    black: int = Field(ge=0)
    defective: int = Field(ge=0)


class FuzzyResultResponse(BaseModel):
    bean_count_100g: float
    skor_cacat_internal: float
    fuzzy_value: float
    grade: str
    estimasi_harga_per_kg: float


# ---------- TRANSACTIONS ----------
class TransactionCreate(BaseModel):
    weight_g: float
    total_beans: int
    good_beans: int = 0
    broken_beans: int = 0
    black_beans: int = 0
    moldy_beans: int = 0
    image_path: Optional[str] = None
    fuzzy_value: float
    grade: str
    estimated_price: float
    bean_count_100g: float


class TransactionDetail(BaseModel):
    id: int
    trx_code: str
    created_at: datetime
    weight_g: float
    total_beans: int
    good_beans: int
    broken_beans: int
    black_beans: int
    moldy_beans: int
    image_path: Optional[str]
    fuzzy_value: float
    grade: str
    estimated_price: float
    bean_count_100g: float


# ---------- DEVICE STATUS ----------
class DeviceStatus(BaseModel):
    esp_online: bool
    camera_ready: bool
    mqtt_connected: bool
    last_heartbeat: Optional[datetime] = None
