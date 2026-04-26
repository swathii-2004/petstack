import logging

from fastapi import APIRouter, Header, HTTPException, Request

from app.config import settings
from app.services.razorpay_service import client

router = APIRouter(prefix="/webhook", tags=["Webhooks"])
logger = logging.getLogger(__name__)

@router.post("/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload = await request.body()
    
    if client and settings.RAZORPAY_KEY_SECRET:
        try:
            # We would verify webhook signature here if we had the webhook secret
            # client.utility.verify_webhook_signature(payload.decode('utf-8'), x_razorpay_signature, webhook_secret)
            pass
        except Exception as e:
            logger.error(f"Webhook verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
            
    # For now, just accept the payload as a mock
    # Actual implementation requires parsing the event and handling order status
    
    return {"status": "ok"}
