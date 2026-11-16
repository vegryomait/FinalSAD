import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./labora.db")

# Pastikan driver psycopg2 digunakan jika schema postgresql:// diberikan (SQLAlchemy 2.0 compatibility)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

SECRET_KEY = os.getenv("SECRET_KEY", "labora-super-secret-key-for-jwt-signing-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
