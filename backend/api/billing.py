import os
import time
import uuid
import razorpay
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from core.auth import require_current_user
from db import get_db
from db.models.identity import User
from db.models.billing import SubscriptionPlan, Subscription, Payment
from utils.email import send_subscription_email

router = APIRouter()

class CreateOrderRequest(BaseModel):
    tier: str  # 'standard' or 'pro'

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

def seed_subscription_plans_if_needed(db: Session):
    """Seed billing plans (standard and pro) if they do not exist."""
    standard = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "standard").first()
    if not standard:
        standard = SubscriptionPlan(
            slug="standard",
            name="Standard Plan",
            tier="standard",
            price_monthly=399.00,
            currency="INR",
            features={},
            limits={},
            is_active=True
        )
        db.add(standard)
    else:
        standard.price_monthly = 399.00
        db.commit()

    pro = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "pro").first()
    if not pro:
        pro = SubscriptionPlan(
            slug="pro",
            name="Pro Plan",
            tier="pro",
            price_monthly=799.00,
            currency="INR",
            features={},
            limits={},
            is_active=True
        )
        db.add(pro)

    db.commit()

def get_razorpay_client():
    """Initialize and return the Razorpay client using env keys."""
    key_id = None
    key_secret = None
    
    for k, v in os.environ.items():
        k_clean = k.strip().lower()
        if k_clean in ("key_id", "razorpay_key_id"):
            key_id = v.strip()
        elif k_clean in ("key_secret", "razorpay_key_secret"):
            key_secret = v.strip()

    if not key_id:
        key_id = (os.environ.get("key_id") or os.environ.get("KEY_ID") or "").strip()
    if not key_secret:
        key_secret = (os.environ.get("key_secret") or os.environ.get("KEY_SECRET") or "").strip()

    if not key_id or not key_secret:
        raise HTTPException(
            status_code=500,
            detail="Razorpay credentials (key_id, key_secret) are not configured in the backend environment."
        )
    return razorpay.Client(auth=(key_id, key_secret)), key_id

@router.post("/billing/create-order")
def create_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Creates a Razorpay order and inserts a pending payment record."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")

    # 1. Ensure target subscription plans exist
    seed_subscription_plans_if_needed(db)

    # 2. Get active plan from DB
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.slug == req.tier,
        SubscriptionPlan.is_active == True
    ).first()
    
    if not plan:
        raise HTTPException(status_code=400, detail=f"Invalid or inactive subscription tier: {req.tier}")

    # 3. Create order in Razorpay
    client, key_id = get_razorpay_client()
    price_in_paise = int(float(plan.price_monthly) * 100)
    
    try:
        order_receipt = f"receipt_{str(user.id)[:8]}_{int(time.time())}"
        order_data = {
            "amount": price_in_paise,
            "currency": plan.currency,
            "receipt": order_receipt,
            "payment_capture": 1
        }
        order = client.order.create(data=order_data)
        order_id = order["id"]
    except Exception as e:
        print(f"[Razorpay Order Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create gateway order: {str(e)}")

    # 4. Insert pending Payment record into Postgres
    payment = Payment(
        user_id=user.id,
        amount=float(plan.price_monthly),
        currency=plan.currency,
        gateway="razorpay",
        gateway_order_id=order_id,
        status="pending"
    )
    db.add(payment)
    db.commit()

    return {
        "success": True,
        "order_id": order_id,
        "amount": price_in_paise,
        "currency": plan.currency,
        "key_id": key_id,
        "user": {
            "email": user.email,
            "name": user.display_name or "Seeker",
            "phone": getattr(user, "phone", "") or ""
        }
    }

@router.post("/billing/verify-payment")
def verify_payment(
    req: VerifyPaymentRequest,
    current_user: dict = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Verifies Razorpay HMAC signature, updates payment status, and activates subscription."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")

    # 1. Verify Razorpay Payment Signature
    client, _ = get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
    except Exception as sig_err:
        print(f"[Razorpay Verification Failed] {sig_err}")
        # Mark payment as failed if we can locate it
        payment = db.query(Payment).filter(Payment.gateway_order_id == req.razorpay_order_id).first()
        if payment:
            payment.status = "failed"
            db.commit()
        raise HTTPException(status_code=400, detail="Invalid payment signature. Verification failed.")

    # 2. Update Payment record to completed
    payment = db.query(Payment).filter(Payment.gateway_order_id == req.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Original payment order record not found.")

    payment.status = "completed"
    payment.gateway_payment_id = req.razorpay_payment_id
    payment.payment_method = "razorpay"

    # 3. Resolve plan by matching amount
    # (standard is 299, pro is 799)
    seed_subscription_plans_if_needed(db)
    slug = "pro" if payment.amount > 500 else "standard"
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == slug).first()
    if not plan:
        raise HTTPException(status_code=500, detail="Matching subscription plan not found in database.")

    # 4. Create/Update Active Subscription in billing.subscriptions
    # Check if they have an existing subscription to update or extend
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == "active"
    ).first()

    now = datetime.utcnow()
    period_end = now + timedelta(days=30)

    if not subscription:
        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status="active",
            billing_cycle="monthly",
            current_period_start=now,
            current_period_end=period_end,
            gateway="razorpay",
            gateway_subscription_id=req.razorpay_payment_id
        )
        db.add(subscription)
    else:
        # Update existing active subscription
        subscription.plan_id = plan.id
        subscription.current_period_start = now
        subscription.current_period_end = period_end
        subscription.gateway_subscription_id = req.razorpay_payment_id

    db.flush()  # Populate IDs
    payment.subscription_id = subscription.id
    db.commit()

    # 5. Send order invoice email to user
    try:
        send_subscription_email(
            user_email=user.email,
            user_name=user.display_name or "Seeker",
            tier=plan.tier,
            amount=float(payment.amount),
            order_id=req.razorpay_order_id,
            payment_id=req.razorpay_payment_id
        )
    except Exception as email_err:
        print(f"[Billing verify-payment] Suppressing invoice email failure: {email_err}")

    return {
        "success": True,
        "message": "Payment verified and subscription activated successfully.",
        "tier": plan.tier
    }
