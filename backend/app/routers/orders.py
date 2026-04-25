import math
from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.database import get_database
from app.dependencies import get_current_user, require_role
from app.models.order import OrderCreate, OrderResponse, OrderStatusUpdate, PaginatedOrders
from app.models.transaction import TransactionCreate
from app.models.user import UserResponse
from app.services.razorpay_service import create_razorpay_order, verify_payment_signature

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: Annotated[UserResponse, Depends(get_current_user)]
):
    db = get_database()
    
    # 1. Calculate total amount and check stock
    total_amount = 0.0
    for item in payload.items:
        product = await db.products.find_one({"_id": ObjectId(item.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.name} not found")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {item.name}")
        total_amount += item.price * item.quantity

    # 2. Save pending order in DB
    order_doc = {
        "user_id": str(current_user.id),
        "items": [item.model_dump() for item in payload.items],
        "total_amount": total_amount,
        "delivery_address": payload.delivery_address,
        "status": "placed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)

    # 3. Create Razorpay order
    receipt = f"rcpt_{order_id[-8:]}"
    rzp_order = create_razorpay_order(amount=total_amount, receipt=receipt, notes={"order_id": order_id})
    
    razorpay_order_id = rzp_order.get("id")
    
    # 4. Update order with Razorpay Order ID
    await db.orders.update_one(
        {"_id": result.inserted_id},
        {"$set": {"razorpay_order_id": razorpay_order_id}}
    )
    
    return {"order_id": order_id, "razorpay_order_id": razorpay_order_id, "amount": rzp_order.get("amount")}

from pydantic import BaseModel
class PaymentVerifyPayload(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    order_id: str

@router.post("/verify-payment")
async def verify_payment(
    payload: PaymentVerifyPayload,
    current_user: Annotated[UserResponse, Depends(get_current_user)]
):
    db = get_database()
    
    # Verify signature
    is_valid = verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
        
    order = await db.orders.find_one({"_id": ObjectId(payload.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update order status
    await db.orders.update_one(
        {"_id": ObjectId(payload.order_id)},
        {"$set": {
            "status": "confirmed",
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Decrement stock
    for item in order["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
        
    # Log transaction
    txn_doc = {
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_signature": payload.razorpay_signature,
        "order_id": payload.order_id,
        "amount": order["total_amount"],
        "status": "success",
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(txn_doc)
    
    return {"status": "success"}

@router.get("/user", response_model=PaginatedOrders)
async def get_user_orders(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    page: int = 1,
    limit: int = 10
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"user_id": str(current_user.id)}
    
    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    return PaginatedOrders(
        items=[OrderResponse(**o) for o in orders],
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1
    )

@router.get("/seller", response_model=PaginatedOrders)
async def get_seller_orders(
    current_user: Annotated[UserResponse, Depends(require_role(["seller"]))],
    page: int = 1,
    limit: int = 10,
    status: str | None = None
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"items.seller_id": str(current_user.id)}
    if status and status != "all":
        query["status"] = status
        
    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    return PaginatedOrders(
        items=[OrderResponse(**o) for o in orders],
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1
    )

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: Annotated[UserResponse, Depends(require_role(["seller"]))]
):
    db = get_database()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Verify seller owns at least one item
    is_seller = any(item.get("seller_id") == str(current_user.id) for item in order["items"])
    if not is_seller:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
        
    update_data = {
        "status": payload.status,
        "updated_at": datetime.utcnow()
    }
    if payload.tracking_number:
        update_data["tracking_number"] = payload.tracking_number
        
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_data}
    )
    
    return {"status": "success", "new_status": payload.status}
