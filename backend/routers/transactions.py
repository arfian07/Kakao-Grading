"""Transactions CRUD — join transaction + image_analysis + fuzzy_result."""
from datetime import datetime
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from db_models.tables import Transaction, ImageAnalysis, FuzzyResult, Device
from models.schemas import TransactionCreate, TransactionDetail

router = APIRouter(prefix="/transactions", tags=["transactions"])


class BulkDeleteRequest(BaseModel):
    ids: List[int]


def _ensure_default_device(db: Session) -> Device:
    dev = db.query(Device).filter(Device.device_name == "kakao-station-01").first()
    if dev is None:
        dev = Device(device_name="kakao-station-01", esp_status=False, camera_status=False)
        db.add(dev)
        db.commit()
        db.refresh(dev)
    return dev


def _to_detail(t: Transaction) -> TransactionDetail:
    ia = t.image_analysis
    fr = t.fuzzy_result
    return TransactionDetail(
        id=t.id,
        trx_code=f"TRX-{t.id:07d}",
        created_at=t.created_at,
        weight_g=t.weight_raw,
        total_beans=ia.total_beans if ia else 0,
        good_beans=ia.good_beans if ia else 0,
        broken_beans=ia.broken_beans if ia else 0,
        black_beans=ia.black_beans if ia else 0,
        moldy_beans=ia.moldy_beans if ia else 0,
        image_path=ia.image_path if ia else None,
        annotated_path=ia.annotated_path if ia else None,
        fuzzy_value=fr.fuzzy_score if fr else 0.0,
        grade=fr.quality_grade if fr else "—",
        estimated_price=float(fr.estimated_price) if fr else 0.0,
        bean_count_100g=fr.bean_count_value if fr else 0.0,
    )


@router.get("", response_model=List[TransactionDetail])
def list_transactions(db: Session = Depends(get_db), limit: int = 200):
    trxs = (
        db.query(Transaction)
        .options(joinedload(Transaction.image_analysis), joinedload(Transaction.fuzzy_result))
        .order_by(Transaction.id.desc())
        .limit(limit)
        .all()
    )
    return [_to_detail(t) for t in trxs]


@router.post("", response_model=TransactionDetail)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    dev = _ensure_default_device(db)
    t = Transaction(device_id=dev.id, weight_raw=payload.weight_g, is_processed=True)
    db.add(t)
    db.flush()  # untuk dapat t.id

    ia = ImageAnalysis(
        transaction_id=t.id,
        total_beans=payload.total_beans,
        good_beans=payload.good_beans,
        broken_beans=payload.broken_beans,
        black_beans=payload.black_beans,
        moldy_beans=payload.moldy_beans,
        image_path=payload.image_path,
        annotated_path=payload.annotated_path,
    )
    fr = FuzzyResult(
        transaction_id=t.id,
        bean_count_value=payload.bean_count_100g,
        fuzzy_score=payload.fuzzy_value,
        quality_grade=payload.grade,
        estimated_price=payload.estimated_price,
    )
    db.add(ia)
    db.add(fr)
    db.commit()
    db.refresh(t)
    return _to_detail(t)


@router.get("/{trx_id}", response_model=TransactionDetail)
def get_transaction(trx_id: int, db: Session = Depends(get_db)):
    t = (
        db.query(Transaction)
        .options(joinedload(Transaction.image_analysis), joinedload(Transaction.fuzzy_result))
        .filter(Transaction.id == trx_id)
        .first()
    )
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    return _to_detail(t)


@router.delete("/{trx_id}")
def delete_transaction(trx_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == trx_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    db.delete(t)
    db.commit()
    return {"ok": True}


@router.post("/bulk-delete")
def bulk_delete(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    if not req.ids:
        return {"deleted": 0}
    deleted = (
        db.query(Transaction)
        .filter(Transaction.id.in_(req.ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted": deleted}