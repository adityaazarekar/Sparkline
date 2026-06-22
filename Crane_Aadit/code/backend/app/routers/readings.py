from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Reading
from app.schemas import ReadingCreate, ReadingResponse
from app.services.alerting import maybe_create_motor_temp_alert

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.post("", response_model=ReadingResponse, status_code=status.HTTP_201_CREATED)
def create_reading(payload: ReadingCreate, db: Session = Depends(get_db)) -> Reading:
    reading = Reading(
        crane_id=payload.crane_id,
        timestamp=payload.timestamp,
        load_kg=payload.load_kg,
        motor_temp_c=payload.motor_temp_c,
        vibration=payload.vibration,
        status=payload.status,
    )
    db.add(reading)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reading already exists for this crane and timestamp",
        ) from exc

    maybe_create_motor_temp_alert(db, reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/latest", response_model=list[ReadingResponse])
def get_latest_readings(db: Session = Depends(get_db)) -> list[Reading]:
    subq = (
        select(
            Reading.crane_id,
            func.max(Reading.timestamp).label("max_ts"),
        )
        .group_by(Reading.crane_id)
        .subquery()
    )
    stmt = (
        select(Reading)
        .join(
            subq,
            (Reading.crane_id == subq.c.crane_id) & (Reading.timestamp == subq.c.max_ts),
        )
        .order_by(Reading.crane_id)
    )
    return list(db.scalars(stmt).all())


@router.get("/{crane_id}", response_model=list[ReadingResponse])
def get_readings_in_range(
    crane_id: str,
    start: datetime = Query(..., description="ISO8601 start timestamp (inclusive)"),
    end: datetime = Query(..., description="ISO8601 end timestamp (inclusive)"),
    db: Session = Depends(get_db),
) -> list[Reading]:
    if start > end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start must be before or equal to end",
        )

    stmt = (
        select(Reading)
        .where(
            Reading.crane_id == crane_id,
            Reading.timestamp >= start,
            Reading.timestamp <= end,
        )
        .order_by(Reading.timestamp.asc())
    )
    return list(db.scalars(stmt).all())
