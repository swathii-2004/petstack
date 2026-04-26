import logging
import razorpay # type: ignore

from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Razorpay client with try-except for missing keys
client = None
try:
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    else:
        logger.warning("Razorpay credentials not fully provided. Razorpay integration will be mocked/disabled.")
except Exception as e:
    logger.error(f"Failed to initialize Razorpay client: {e}")

def create_razorpay_order(amount: float, receipt: str, notes: dict = None) -> dict:
    """Create an order on Razorpay for the given amount (in INR)."""
    if not client:
        # Mock response if keys are missing
        return {
            "id": f"order_mock_{receipt}",
            "entity": "order",
            "amount": int(amount * 100),
            "amount_paid": 0,
            "amount_due": int(amount * 100),
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "attempts": 0,
            "notes": notes or {}
        }
    
    data = {
        "amount": int(amount * 100), # amount in paise
        "currency": "INR",
        "receipt": receipt,
        "notes": notes or {}
    }
    
    return client.order.create(data=data)

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """Verify the signature from Razorpay after payment."""
    if not client:
        # If running in mock mode, accept any non-empty signature for test purposes
        return bool(razorpay_signature)
        
    try:
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False
