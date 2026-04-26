import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.razorpay_service import create_razorpay_order

def test():
    try:
        rzp = create_razorpay_order(amount=50.0, receipt="test_123")
        print("Success:", rzp["id"])
    except Exception as e:
        print("Error:", e)

test()
