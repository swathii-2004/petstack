from __future__ import annotations

from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections grouped by appointment_id (chat room)."""

    def __init__(self) -> None:
        # appointment_id -> list of active WebSocket connections
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, appointment_id: str) -> None:
        await websocket.accept()
        self.rooms[appointment_id].append(websocket)

    def disconnect(self, websocket: WebSocket, appointment_id: str) -> None:
        self.rooms[appointment_id].remove(websocket)
        if not self.rooms[appointment_id]:
            del self.rooms[appointment_id]

    async def broadcast(self, appointment_id: str, message: dict) -> None:
        """Send a message to all connections in the room."""
        dead: list[WebSocket] = []
        for connection in self.rooms.get(appointment_id, []):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for ws in dead:
            self.disconnect(ws, appointment_id)


# Singleton instance shared across the application
manager = ConnectionManager()
