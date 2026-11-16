import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from .database import engine, Base
from .seed import seed_database
from .routers import (
    auth, users, rooms, equipment,
    schedules, bookings, approvals,
    returns, late_records, reports
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed initial data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title="Labora API - Layanan Laboratorium Terpadu",
    description="Backend API untuk Pengelolaan Ruangan dan Alat Laboratorium dengan 14 Tabel Relasional",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rooms.router)
app.include_router(equipment.router)
app.include_router(schedules.router)
app.include_router(bookings.router)
app.include_router(approvals.router)
app.include_router(returns.router)
app.include_router(late_records.router)
app.include_router(reports.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "labora-api"}

# Serve Frontend static assets if built
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes and docs to bypass
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "sistem": "labora. - Layanan Laboratorium Terpadu",
            "status": "Online",
            "docs_url": "/docs",
            "openapi_url": "/openapi.json"
        }
