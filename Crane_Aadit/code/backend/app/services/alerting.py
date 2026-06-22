import logging

from sqlalchemy.orm import Session

from app.config import MOTOR_TEMP_THRESHOLD_C
from app.models import Alert, Reading

logger = logging.getLogger(__name__)


def maybe_create_motor_temp_alert(db: Session, reading: Reading) -> Alert | None:
    temp = float(reading.motor_temp_c)
    if temp <= MOTOR_TEMP_THRESHOLD_C:
        return None

    message = f"ALERT: {reading.crane_id} motor temp {temp:.1f}°C exceeds threshold"
    logger.warning(message)

    alert = Alert(
        crane_id=reading.crane_id,
        reading_id=reading.id,
        alert_type="motor_temp_high",
        message=message,
        motor_temp_c=temp,
    )
    db.add(alert)
    db.flush()
    return alert
