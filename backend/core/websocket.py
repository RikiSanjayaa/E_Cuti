"""
WebSocket Connection Manager for Real-Time Notifications

Handles multiple WebSocket connections and broadcasts notifications
to all connected clients when database changes occur.
"""
from fastapi import WebSocket
from typing import List, Dict, Any
import json
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections and broadcasts notifications."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Send a message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WS] Error sending to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def notify_change(
        self,
        entity: str,
        action: str,
        username: str,
        entity_id: int = None,
        details: str = None
    ):
        """
        Broadcast a data change notification.
        
        Args:
            entity: The entity type that changed (leaves, personnel, users, etc.)
            action: The action performed (create, update, delete)
            username: The user who made the change
            entity_id: Optional ID of the affected entity
            details: Optional additional details about the change
        """
        message = {
            "type": "data_change",
            "entity": entity,
            "action": action,
            "username": username,
            "entity_id": entity_id,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(message)
        print(f"[WS] Notified: {username} {action}d {entity}" + (f" #{entity_id}" if entity_id else ""))


# Singleton instance
manager = ConnectionManager()
