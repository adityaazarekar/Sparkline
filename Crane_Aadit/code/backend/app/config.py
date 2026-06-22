import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://sparkline:sparkline@localhost:5432/sparkline",
)
MOTOR_TEMP_THRESHOLD_C = float(os.getenv("MOTOR_TEMP_THRESHOLD_C", "80"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
