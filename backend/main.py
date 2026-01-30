from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from .core.websocket import manager

app = FastAPI(title="Sistem Monitoring Izin Personel Polda NTB")


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

# CORS
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
]

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
