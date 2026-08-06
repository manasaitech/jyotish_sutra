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
        Subscription.status == "active",
        (Subscription.current_period_end == None) | (Subscription.current_period_end > datetime.utcnow())
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


class CreateConsultationOrderRequest(BaseModel):
    plan: str  # 'single' (₹251) or 'full' (₹2001)

class VerifyConsultationRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan: str
    name: str
    phone: str
    email: Optional[str] = None
    topic: str
    date: str
    time_slot: str
    question: Optional[str] = ""

@router.post("/billing/create-consultation-order")
def create_consultation_order(req: CreateConsultationOrderRequest):
    """Create Razorpay order for Expert Consultation (₹251 or ₹2001). Publicly accessible for fast booking."""
    client, key_id = get_razorpay_client()
    
    amount_inr = 251.0 if req.plan == 'single' else 3001.0
    amount_paise = int(amount_inr * 100)

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"consult_{uuid.uuid4().hex[:10]}",
            "notes": {
                "type": "expert_consultation",
                "plan": req.plan
            }
        })
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": key_id
        }
    except Exception as err:
        print(f"[Create Consultation Order Error] {err}")
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(err)}")


@router.post("/billing/verify-consultation")
def verify_consultation_payment(req: VerifyConsultationRequest):
    """Verify Razorpay payment signature and send email notifications to Customer & Guruji/Support."""
    from utils.email import send_consultation_emails

    client, _ = get_razorpay_client()

    # 1. Verify Razorpay Signature
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
    except Exception as sig_err:
        print(f"[Consultation Signature Error] {sig_err}")
        raise HTTPException(status_code=400, detail="Payment verification failed: Invalid Razorpay signature.")

    # 2. Amount and Details
    amount_inr = 251.0 if req.plan == 'single' else 3001.0
    booking_id = "ASTRO-" + str(uuid.uuid4().hex[:8]).upper()
    customer_email = req.email.strip() if (req.email and "@" in req.email) else f"{req.phone.strip()}@consultation.astrosutra.ai"

    # 3. Dispatch Emails to Customer and Guruji (anmoldixit091@gmail.com)
    try:
        send_consultation_emails(
            customer_name=req.name.strip(),
            customer_phone=req.phone.strip(),
            customer_email=customer_email,
            plan_tier=req.plan,
            amount=amount_inr,
            booking_id=booking_id,
            payment_id=req.razorpay_payment_id,
            order_id=req.razorpay_order_id,
            topic=req.topic,
            preferred_date=req.date or "As per availability",
            time_slot=req.time_slot or "10:00 AM - 1:00 PM",
            question=req.question or ""
        )
    except Exception as mail_err:
        print(f"[Consultation Email Error] Suppressed mail error: {mail_err}")

    return {
        "success": True,
        "booking_id": booking_id,
        "payment_id": req.razorpay_payment_id,
        "message": "Payment verified and appointment request emails sent successfully."
    }


# ---------------------------------------------------------------------------
# PAY PER QUESTION ENDPOINTS
# ---------------------------------------------------------------------------

class CreateQuestionsOrderRequest(BaseModel):
    questions_count: int

class VerifyQuestionsPaymentRequest(BaseModel):
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    questions_count: int
    user_id: str


@router.post("/billing/create-questions-order")
def create_questions_order(
    req: CreateQuestionsOrderRequest,
    current_user: dict = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Creates a Razorpay order or mock checkout for Pay-Per-Question packs."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")

    if req.questions_count < 1 or req.questions_count > 500:
        raise HTTPException(status_code=400, detail="Question count must be between 1 and 500.")

    total_price = float(req.questions_count * 5.5)
    price_in_paise = int(total_price * 100)

    try:
        client, key_id = get_razorpay_client()
        order_receipt = f"q_receipt_{str(user.id)[:8]}_{int(time.time())}"
        order_data = {
            "amount": price_in_paise,
            "currency": "INR",
            "receipt": order_receipt,
            "payment_capture": 1
        }
        order = client.order.create(data=order_data)
        order_id = order["id"]

        # Insert pending Payment record
        payment = Payment(
            user_id=user.id,
            amount=total_price,
            currency="INR",
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
            "currency": "INR",
            "key_id": key_id,
            "gateway": "razorpay"
        }
    except Exception as e:
        # Fallback to Mock checkout if Razorpay is not configured or fails
        print(f"[Questions Order] Razorpay unavailable, falling back to mock checkout: {e}")
        mock_order_id = f"mock_order_{str(uuid.uuid4().hex[:12]).upper()}"
        return {
            "success": True,
            "order_id": mock_order_id,
            "amount": price_in_paise,
            "currency": "INR",
            "key_id": "mock_key_id",
            "gateway": "mock"
        }


@router.post("/billing/verify-questions-payment")
def verify_questions_payment(
    req: VerifyQuestionsPaymentRequest,
    current_user: dict = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Verifies questions payment, marks payment completed, and credits user's question balance."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")

    if req.questions_count < 1 or req.questions_count > 500:
        raise HTTPException(status_code=400, detail="Question count must be between 1 and 500.")

    # 1. Signature check (Razorpay vs Mock)
    is_mock = not req.razorpay_signature or req.razorpay_signature == "mock"
    
    if not is_mock:
        try:
            client, _ = get_razorpay_client()
            client.utility.verify_payment_signature({
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature
            })
        except Exception as sig_err:
            print(f"[Questions Signature Verification Failed] {sig_err}")
            raise HTTPException(status_code=400, detail="Invalid signature. Verification failed.")

    # 2. Update Payment log if exists in database
    payment = db.query(Payment).filter(Payment.gateway_order_id == req.razorpay_order_id).first()
    if payment:
        payment.status = "completed"
        payment.gateway_payment_id = req.razorpay_payment_id or "mock_payment"
        payment.payment_method = "mock" if is_mock else "razorpay"
        db.commit()

    # 3. Credit user's questions balance in profile store
    from services.memory.profile_store import profile_store
    profile = profile_store.load_profile(req.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found for question balance credit.")

    chart_payload = profile.get("natal_chart") or {}
    # Reconstruct nested chart structure if exists
    is_nested = False
    if "natal" in chart_payload:
        chart_dict = chart_payload["natal"]
        is_nested = True
    else:
        chart_dict = chart_payload

    current_balance = chart_dict.get("retail_question_balance", 0)
    new_balance = current_balance + req.questions_count
    
    # Write back to profile
    if is_nested:
        chart_payload["natal"]["retail_question_balance"] = new_balance
    else:
        chart_payload["retail_question_balance"] = new_balance

    # Ensure profile stores updated natal_chart
    profile_store.update_profile(req.user_id, natal_chart=chart_payload)

    return {
        "success": True,
        "message": f"Successfully credited {req.questions_count} questions to user balance.",
        "retail_question_balance": new_balance
    }


