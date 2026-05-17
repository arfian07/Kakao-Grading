"""
SQLAlchemy ORM models matching skema MySQL dari /5_database.sql
Schema target: MySQL InnoDB utf8mb4. Saat di-run dengan SQLite (dev fallback)
SQLAlchemy otomatis adaptasi tipe data.
"""
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Float, Text, Boolean,
    ForeignKey, DateTime, Numeric, Index,
)
from sqlalchemy.orm import relationship
from core.database import Base

# SQLite tidak support autoincrement BigInteger; gunakan variant agar tetap MySQL-compatible
PK = BigInteger().with_variant(Integer(), "sqlite")


class Device(Base):
    __tablename__ = "devices"
    id = Column(PK, primary_key=True, autoincrement=True)
    device_name = Column(String(255), nullable=False)
    esp_status = Column(Boolean, nullable=False, default=False)
    camera_status = Column(Boolean, nullable=False, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="device", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(PK, primary_key=True, autoincrement=True)
    device_id = Column(PK, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    weight_raw = Column(Float, nullable=False)
    is_processed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    device = relationship("Device", back_populates="transactions")
    image_analysis = relationship("ImageAnalysis", back_populates="transaction",
                                  uselist=False, cascade="all, delete-orphan")
    fuzzy_result = relationship("FuzzyResult", back_populates="transaction",
                                uselist=False, cascade="all, delete-orphan")


class ImageAnalysis(Base):
    __tablename__ = "image_analyses"
    id = Column(PK, primary_key=True, autoincrement=True)
    transaction_id = Column(PK, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    total_beans = Column(Integer, nullable=False)
    broken_beans = Column(Integer, nullable=False)
    moldy_beans = Column(Integer, nullable=False)
    image_path = Column(String(255), nullable=True)
    # Tambahan kolom: black_beans & good_beans untuk YOLO 4-class
    # (sesuai inference_model.ipynb: Bagus/Rusak/Hitam/Berjamur)
    black_beans = Column(Integer, nullable=False, default=0)
    good_beans = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="image_analysis")


class FuzzyResult(Base):
    __tablename__ = "fuzzy_results"
    id = Column(PK, primary_key=True, autoincrement=True)
    transaction_id = Column(PK, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    bean_count_value = Column(Float, nullable=False)
    fuzzy_score = Column(Float, nullable=False)
    quality_grade = Column(String(255), nullable=False)
    estimated_price = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="fuzzy_result")


class Setting(Base):
    __tablename__ = "settings"
    id = Column(PK, primary_key=True, autoincrement=True)
    key = Column("key", String(255), nullable=False, unique=True)
    value = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(PK, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String(255), nullable=False)
    remember_token = Column(String(100), nullable=True)
    role = Column(String(50), nullable=False, default="Operator")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    email = Column(String(255), primary_key=True)
    token = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=True)


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(255), primary_key=True)
    user_id = Column(BigInteger, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    payload = Column(Text, nullable=False)
    last_activity = Column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_last_activity", "last_activity"),
    )
