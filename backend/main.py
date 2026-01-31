from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from datetime import datetime, timedelta

from .core.websocket import manager
from .core.database import SessionLocal
from .models import AuditLog

# Background task for cleaning up old audit logs (older than 1 year)
async def cleanup_old_audit_logs():
    """Delete audit logs older than 1 year. Runs on startup and every 24 hours."""
    while True:
        try:
            db = SessionLocal()
            try:
                one_year_ago = datetime.utcnow() - timedelta(days=365)
                deleted_count = db.query(AuditLog).filter(
                    AuditLog.timestamp < one_year_ago
                ).delete(synchronize_session=False)
                db.commit()
                if deleted_count > 0:
                    print(f"[Audit Cleanup] Deleted {deleted_count} audit logs older than 1 year")
            finally:
                db.close()
        except Exception as e:
            print(f"[Audit Cleanup] Error during cleanup: {e}")
        
        # Wait 24 hours before next cleanup
        await asyncio.sleep(24 * 60 * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown tasks."""
    # Start background task for audit log cleanup
    cleanup_task = asyncio.create_task(cleanup_old_audit_logs())
    print("[Startup] Audit log cleanup task started")
    
    yield
    
    # Cancel cleanup task on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        print("[Shutdown] Audit log cleanup task stopped")

app = FastAPI(
    title="Sistem Monitoring Izin Personel Polda NTB",
    lifespan=lifespan
)


@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, receive any client messages (heartbeat)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from dotenv import load_dotenv

load_dotenv()

# CORS
# Get origins from env var, default to common development ports
frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:3000")
origins = [url.strip() for url in frontend_urls.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if not exists
os.makedirs("uploads/evidence", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="uploads"), name="static")

from .routers import auth, personnel, leaves, dashboard, reports, audit, users, leave_types, holidays

app.include_router(auth.router)
app.include_router(personnel.router)
app.include_router(leaves.router)
app.include_router(leave_types.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(users.router)
app.include_router(holidays.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Sistem Monitoring Izin Personel Polda NTB API"}
