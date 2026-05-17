"""Pengaturan harga referensi → table `settings` (key/value)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from db_models.tables import Setting
from models.schemas import PricesResponse, PricesUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = {"price_mutu_1": "50000", "price_mutu_2": "42000", "price_mutu_3": "33000"}


def _get(db: Session, key: str, default: str) -> str:
    s = db.query(Setting).filter(Setting.key == key).first()
    if s is None:
        s = Setting(key=key, value=default)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s.value


def _set(db: Session, key: str, value: str):
    s = db.query(Setting).filter(Setting.key == key).first()
    if s is None:
        s = Setting(key=key, value=value)
        db.add(s)
    else:
        s.value = value
    db.commit()


@router.get("/prices", response_model=PricesResponse)
def get_prices(db: Session = Depends(get_db)):
    return PricesResponse(
        mutu_1=float(_get(db, "price_mutu_1", DEFAULTS["price_mutu_1"])),
        mutu_2=float(_get(db, "price_mutu_2", DEFAULTS["price_mutu_2"])),
        mutu_3=float(_get(db, "price_mutu_3", DEFAULTS["price_mutu_3"])),
    )


@router.put("/prices", response_model=PricesResponse)
def update_prices(prices: PricesUpdate, db: Session = Depends(get_db)):
    _set(db, "price_mutu_1", str(prices.mutu_1))
    _set(db, "price_mutu_2", str(prices.mutu_2))
    _set(db, "price_mutu_3", str(prices.mutu_3))
    return PricesResponse(**prices.model_dump())
