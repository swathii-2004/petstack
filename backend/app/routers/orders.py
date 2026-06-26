import math
from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.database import get_database
from app.dependencies import get_current_user, require_role, require_active
from app.models.order import OrderCreate, OrderResponse, OrderStatusUpdate, PaginatedOrders
from app.models.transaction import TransactionCreate
from app.models.user import UserResponse, UserRole
import stripe
from app.config import settings
from app.utils.pdf_generator import generate_invoice_pdf
from app.utils.cloudinary_upload import upload_pdf

stripe.api_key = settings.STRIPE_SECRET_KEY

async def generate_and_upload_invoice_doc(order_doc: dict, user_doc: dict) -> str | None:
    try:
        # Generate the invoice PDF using details
        pdf_bytes = generate_invoice_pdf(order_doc, user_doc)
        url = await upload_pdf(pdf_bytes, folder="petstack/invoices")
        return url
    except Exception as e:
        print(f"Error generating or uploading invoice PDF: {e}")
        return None

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))]
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
    status_val = "placed" if payload.payment_method == "stripe" else "confirmed"

    order_doc = {
        "user_id": str(current_user["_id"]),
        "items": [item.model_dump() for item in payload.items],
        "total_amount": total_amount,
        "delivery_address": payload.delivery_address,
        "payment_method": payload.payment_method,
        "status": status_val,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)

    if payload.payment_method == "cod":
        # Decrement stock immediately for COD
        for item in payload.items:
            await db.products.update_one(
                {"_id": ObjectId(item.product_id)},
                {"$inc": {"stock": -item.quantity}}
            )
        
        # Generate invoice
        order_for_pdf = dict(order_doc)
        order_for_pdf["id"] = order_id
        invoice_url = await generate_and_upload_invoice_doc(order_for_pdf, current_user)
        if invoice_url:
            await db.orders.update_one(
                {"_id": result.inserted_id},
                {"$set": {"invoice_url": invoice_url}}
            )
        return {"order_id": order_id, "amount": total_amount, "status": "confirmed", "invoice_url": invoice_url}

    if payload.payment_method == "stripe":
        # Create Stripe session
        line_items = []
        for item in payload.items:
            line_items.append({
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": item.name,
                    },
                    "unit_amount": int(item.price * 100),
                },
                "quantity": item.quantity,
            })
            
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f"{settings.FRONTEND_USER_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
                cancel_url=f"{settings.FRONTEND_USER_URL}/checkout",
                client_reference_id=order_id,
            )
            
            await db.orders.update_one(
                {"_id": result.inserted_id},
                {"$set": {"stripe_session_id": session.id}}
            )
            
            return {"order_id": order_id, "checkout_url": session.url, "amount": total_amount}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    # Fallback/Default
    return {"order_id": order_id, "amount": total_amount, "status": "placed"}

from pydantic import BaseModel
class StripeVerifyPayload(BaseModel):
    session_id: str
    order_id: str

@router.post("/verify-stripe")
async def verify_stripe(
    payload: StripeVerifyPayload,
    current_user: Annotated[UserResponse, Depends(get_current_user)]
):
    db = get_database()
    
    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if session.payment_status != 'paid':
        raise HTTPException(status_code=400, detail="Payment not completed")
        
    order = await db.orders.find_one({"_id": ObjectId(payload.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.get("status") == "confirmed":
        return {"status": "success"} # Already confirmed
        
    # Update order status
    user_doc = await db.users.find_one({"_id": ObjectId(order["user_id"])})
    if not user_doc:
        user_doc = current_user
        
    order_for_pdf = dict(order)
    order_for_pdf["status"] = "confirmed"
    invoice_url = await generate_and_upload_invoice_doc(order_for_pdf, user_doc)

    await db.orders.update_one(
        {"_id": ObjectId(payload.order_id)},
        {"$set": {
            "status": "confirmed",
            "invoice_url": invoice_url,
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
        "stripe_session_id": payload.session_id,
        "order_id": payload.order_id,
        "amount": order["total_amount"],
        "status": "success",
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(txn_doc)
    
    return {"status": "success"}



@router.get("/user", response_model=PaginatedOrders)
async def get_user_orders(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.user]))],
    page: int = 1,
    limit: int = 10
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"user_id": str(current_user["_id"])}
    
    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    return PaginatedOrders(
        items=[OrderResponse(**o) for o in orders],
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1
    )

@router.get("/seller/payouts")
async def get_seller_payouts(
    current_user: Annotated[UserResponse, Depends(require_active([UserRole.seller]))]
):
    db = get_database()
    seller_id = str(current_user["_id"])
    
    # We will aggregate all orders that have items belonging to this seller
    pipeline = [
        {"$unwind": "$items"},
        {"$match": {"items.seller_id": seller_id, "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}}},
        {"$group": {
            "_id": "$status",
            "total_earnings": {
                "$sum": { "$multiply": ["$items.price", "$items.quantity"] }
            }
        }}
    ]
    
    cursor = db.orders.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    available = 0.0
    pending = 0.0
    
    for r in results:
        status = r["_id"]
        amount = r["total_earnings"]
        if status == "delivered":
            available += amount
        else:
            pending += amount
            
    lifetime = available + pending
    
    # Fetch recent orders to construct a payout history
    orders_pipeline = [
        {"$match": {"items.seller_id": seller_id, "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}}},
        {"$sort": {"created_at": -1}},
        {"$limit": 10}
    ]
    cursor = db.orders.aggregate(orders_pipeline)
    recent_orders = await cursor.to_list(length=10)
    
    payout_history = []
    for order in recent_orders:
        order_earnings = sum(
            item["price"] * item["quantity"]
            for item in order["items"]
            if item.get("seller_id") == seller_id
        )
        payout_history.append({
            "order_id": str(order["_id"]),
            "amount": order_earnings,
            "status": "available" if order["status"] == "delivered" else "pending",
            "date": order["created_at"].isoformat() if isinstance(order["created_at"], datetime) else order["created_at"]
        })
        
    return {
        "available": available,
        "pending": pending,
        "lifetime": lifetime,
        "history": payout_history
    }


@router.get("/seller", response_model=PaginatedOrders)
async def get_seller_orders(
    current_user: Annotated[UserResponse, Depends(require_active([UserRole.seller]))],
    page: int = 1,
    limit: int = 10,
    status: str | None = None
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"items.seller_id": str(current_user["_id"])}
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

@router.get("/admin", response_model=PaginatedOrders)
async def get_all_orders(
    current_user: Annotated[UserResponse, Depends(require_role([UserRole.admin]))],
    page: int = 1,
    limit: int = 10,
    status: str | None = None
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {}
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
    current_user: Annotated[UserResponse, Depends(require_active([UserRole.seller]))]
):
    db = get_database()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Verify seller owns at least one item
    is_seller = any(item.get("seller_id") == str(current_user["_id"]) for item in order["items"])
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



