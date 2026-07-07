from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base
from app.routers import auth, complaints, technicians, admin, analytics, notifications, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Hostel Complaint Management API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
app.include_router(technicians.router, prefix="/technicians", tags=["Technicians"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(analytics.router, prefix="/admin/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])


@app.get("/")
async def root():
    return {"message": "Welcome to FixTrack API", "status": "ok", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
