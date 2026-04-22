from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase


class AuditLog(BaseModel):
    admin_id: str
    action: str
    target_id: str
    target_role: str
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


async def insert_audit_log(db: AsyncIOMotorDatabase, log: AuditLog) -> None:
    """Inserts a new audit log entry into the admin_audit_log collection."""
    await db["admin_audit_log"].insert_one(log.model_dump())
