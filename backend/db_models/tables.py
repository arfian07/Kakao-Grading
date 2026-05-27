"""
SQLAlchemy ORM models matching skema MySQL dari database.sql
Schema target: MySQL InnoDB utf8mb4. Saat di-run dengan SQLite (dev fallback)
SQLAlchemy otomatis adaptasi tipe data.
"""
from datetime import datetime
from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float,
    Index, Integer, Numeric, String, Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from core.database import Base

# ---------------------------------------------------------------------------
# Helper: BigInteger yang tetap bekerja di SQLite (dev fallback)
# Hanya dipakai untuk PRIMARY KEY — kolom FK tetap pakai BigInteger biasa
# agar tidak ada konflik tipe.
# ---------------------------------------------------------------------------
PK_TYPE = BigInteger().with_variant(Integer(), "sqlite")


class Device(Base):
    __tablename__ = "devices"

    id             = Column(PK_TYPE, primary_key=True, autoincrement=True)
    device_name    = Column(String(255), nullable=False)
    esp_status     = Column(Boolean, nullable=False, default=False)
    camera_status  = Column(Boolean, nullable=False, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship(
        "Transaction",
        back_populates="device",
        cascade="all, delete-orphan",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id           = Column(PK_TYPE, primary_key=True, autoincrement=True)
    # FK kolom: gunakan BigInteger biasa (bukan PK_TYPE) agar tidak jadi PK kedua
    device_id    = Column(BigInteger, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    weight_raw   = Column(Float, nullable=False)
    is_processed = Column(Boolean, nullable=False, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_transactions_device_id", "device_id"),
    )

    # Relationships
    device        = relationship("Device", back_populates="transactions")
    image_analysis = relationship(
        "ImageAnalysis",
        back_populates="transaction",
        uselist=False,
        cascade="all, delete-orphan",
    )
    fuzzy_result  = relationship(
        "FuzzyResult",
        back_populates="transaction",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ImageAnalysis(Base):
    __tablename__ = "image_analyses"

    id             = Column(PK_TYPE, primary_key=True, autoincrement=True)
    # FK kolom: gunakan BigInteger biasa
    transaction_id = Column(BigInteger, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    total_beans    = Column(Integer, nullable=False)
    good_beans     = Column(Integer, nullable=False, default=0)   # kelas "Bagus" 
    broken_beans   = Column(Integer, nullable=False)               # kelas "Rusak"
    black_beans    = Column(Integer, nullable=False, default=0)   # kelas "Hitam"  
    moldy_beans    = Column(Integer, nullable=False)               # kelas "Berjamur"
    image_path     = Column(String(255), nullable=True)
    annotated_path = Column(String(255), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_image_analyses_transaction_id", "transaction_id"),
    )

    # Relationships
    transaction = relationship("Transaction", back_populates="image_analysis")


class FuzzyResult(Base):
    __tablename__ = "fuzzy_results"

    id               = Column(PK_TYPE, primary_key=True, autoincrement=True)
    # FK kolom: gunakan BigInteger biasa
    transaction_id   = Column(BigInteger, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    bean_count_value = Column(Float, nullable=False)
    fuzzy_score      = Column(Float, nullable=False)
    quality_grade    = Column(String(255), nullable=False)
    estimated_price  = Column(Numeric(15, 2), nullable=False)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_fuzzy_results_transaction_id", "transaction_id"),
    )

    # Relationships
    transaction = relationship("Transaction", back_populates="fuzzy_result")


class Setting(Base):
    __tablename__ = "settings"

    id         = Column(PK_TYPE, primary_key=True, autoincrement=True)
    key        = Column("key", String(255), nullable=False, unique=True)
    value      = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id                = Column(PK_TYPE, primary_key=True, autoincrement=True)
    name              = Column(String(255), nullable=False)
    email             = Column(String(255), nullable=False, unique=True)
    email_verified_at = Column(DateTime, nullable=True)
    password          = Column(String(255), nullable=False)
    role              = Column(String(50), nullable=False, default="Operator")
    remember_token    = Column(String(100), nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    email      = Column(String(255), primary_key=True)
    token      = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=True)


class Session(Base):
    __tablename__ = "sessions"

    id            = Column(String(255), primary_key=True)
    user_id       = Column(BigInteger, nullable=True)
    ip_address    = Column(String(45), nullable=True)
    user_agent    = Column(Text, nullable=True)
    payload       = Column(Text, nullable=False)
    last_activity = Column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_last_activity", "last_activity"),
    )