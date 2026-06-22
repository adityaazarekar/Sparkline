from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert
from app.schemas import AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def list_alerts(db: Session = Depends(get_db)) -> list[Alert]:
    stmt = select(Alert).order_by(Alert.created_at.desc())
    return list(db.scalars(stmt).all())
