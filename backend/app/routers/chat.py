from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError

from app.database import get_database
from app.utils.connection_manager import manager
from app.utils.jwt import decode_token

router = APIRouter(prefix="/ws", tags=["Chat"])


@router.websocket("/chat/{appointment_id}")
async def chat_endpoint(websocket: WebSocket, appointment_id: str, token: str = Query(...)):
    """
    WebSocket chat endpoint.
    - Auth: JWT passed as ?token=xxx query param
    - Access: Only vet or user who owns the appointment
    - Gate: Appointment must have status='accepted'
    """
    # ── 1. Authenticate ───────────────────────────────────────────────────────
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if not user_id or not role:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── 2. Verify appointment access ──────────────────────────────────────────
    db = get_database()
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not appt:
        await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
        return

    # Only vet or owner can join
    is_vet = appt.get("vet_id") == user_id
    is_owner = appt.get("user_id") == user_id
    if not (is_vet or is_owner):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Chat only allowed for accepted or completed appointments
    if appt.get("status") not in ("accepted", "completed"):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ── 3. Connect ────────────────────────────────────────────────────────────
    await manager.connect(websocket, appointment_id)

    # ── 4. Send message history (last 50 messages) ────────────────────────────
    cursor = db.messages.find(
        {"appointment_id": appointment_id}
    ).sort("created_at", 1).limit(50)
    history = await cursor.to_list(length=50)

    for msg in history:
        msg["_id"] = str(msg["_id"])
        msg["created_at"] = msg["created_at"].isoformat()
        await websocket.send_json({"type": "history", "message": msg})

    # Signal the client that history is done
    await websocket.send_json({"type": "ready"})

    # ── 5. Fetch sender display info ──────────────────────────────────────────
    sender = await db.users.find_one({"_id": ObjectId(user_id)})
    sender_name = sender.get("full_name", "Unknown") if sender else "Unknown"

    # ── 6. Main message loop ──────────────────────────────────────────────────
    try:
        while True:
            data = await websocket.receive_json()
            text = data.get("text", "").strip()
            if not text:
                continue

            now = datetime.utcnow()
            msg_doc = {
                "appointment_id": appointment_id,
                "sender_id": user_id,
                "sender_name": sender_name,
                "sender_role": role,
                "text": text,
                "created_at": now,
            }
            result = await db.messages.insert_one(msg_doc)

            broadcast_payload = {
                "type": "message",
                "message": {
                    "_id": str(result.inserted_id),
                    "appointment_id": appointment_id,
                    "sender_id": user_id,
                    "sender_name": sender_name,
                    "sender_role": role,
                    "text": text,
                    "created_at": now.isoformat(),
                },
            }
            await manager.broadcast(appointment_id, broadcast_payload)

    except WebSocketDisconnect:
        manager.disconnect(websocket, appointment_id)
