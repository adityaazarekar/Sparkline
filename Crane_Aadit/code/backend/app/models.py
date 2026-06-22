from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crane_id: Mapped[str] = mapped_column(String(32), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    load_kg: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    motor_temp_c: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    vibration: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    alerts: Mapped[list["Alert"]] = relationship(back_populates="reading")

    __table_args__ = (
        Index("ix_readings_crane_id_timestamp", "crane_id", "timestamp"),
        Index("uq_readings_crane_timestamp", "crane_id", "timestamp", unique=True),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    crane_id: Mapped[str] = mapped_column(String(32), nullable=False)
    reading_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("readings.id"), nullable=True
    )
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    motor_temp_c: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    reading: Mapped["Reading | None"] = relationship(back_populates="alerts")

    __table_args__ = (Index("ix_alerts_created_at", "created_at"),)
