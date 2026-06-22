from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ReadingCreate(BaseModel):
    crane_id: str = Field(..., min_length=1, max_length=32)
    timestamp: datetime
    load_kg: float | None = None
    motor_temp_c: float
    vibration: float | None = None
    status: str = Field(..., min_length=1, max_length=32)


class ReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crane_id: str
    timestamp: datetime
    load_kg: float | None
    motor_temp_c: float
    vibration: float | None
    status: str
    created_at: datetime


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    crane_id: str
    reading_id: int | None
    alert_type: str
    message: str
    motor_temp_c: float | None
    created_at: datetime


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
