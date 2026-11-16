import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./labora.db")
# Fix postgres:// to postgresql:// for SQLAlchemy if needed (Render/Neon compatibility)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SECRET_KEY = os.getenv("SECRET_KEY", "labora-super-secret-key-for-jwt-signing-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
