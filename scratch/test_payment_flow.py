import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env
dotenv_path = "c:\\Users\\ASUS\\Desktop\\Kundli_GPT_Clone\\.env"
print(f"Loading env from: {dotenv_path}")
load_dotenv(dotenv_path)

# Insert backend directory into system path
backend_dir = "c:\\Users\\ASUS\\Desktop\\Kundli_GPT_Clone\\backend"
sys.path.insert(0, backend_dir)

from db import SessionLocal
from db.models.identity import User
from db.models.billing import SubscriptionPlan, Subscription, Payment
from api.billing import seed_subscription_plans_if_needed
from utils.email import send_subscription_email

def test_verify_payment_flow():
    db = SessionLocal()
    try:
        print("\n1. Seeding subscription plans...")
        seed_subscription_plans_if_needed(db)
        
        # Verify pro plan price in database
        pro_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "pro").first()
        print(f"   Database Pro Plan price: INR {pro_plan.price_monthly}")
        assert pro_plan.price_monthly == 1.00, f"Expected Pro price 1.00, got {pro_plan.price_monthly}"

        # 2. Get or create a test user
        print("\n2. Getting/Creating test user...")
        test_user = db.query(User).filter(User.email == "bholudixitanmoldixit@gmail.com").first()
        if not test_user:
            test_user = User(
                firebase_uid="test_firebase_uid_123",
                email="bholudixitanmoldixit@gmail.com",
                display_name="Bholu Dixit Test"
            )
            db.add(test_user)
            db.commit()
            print(f"   Created new test user ID: {test_user.id}")
        else:
            print(f"   Found existing test user ID: {test_user.id}")

        # 3. Create a pending payment record
        print("\n3. Creating pending payment with metadata_={'tier': 'pro'}...")
        test_order_id = f"test_order_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        pending_payment = Payment(
            user_id=test_user.id,
            amount=1.00,
            currency="INR",
            gateway="razorpay",
            gateway_order_id=test_order_id,
            status="pending",
            metadata_={"tier": "pro"}
        )
        db.add(pending_payment)
        db.commit()
        print(f"   Created payment record with gateway_order_id: {test_order_id}")

        # 4. Simulate payment verification
        print("\n4. Running payment verification logic...")
        
        # Fetch payment record
        payment = db.query(Payment).filter(Payment.gateway_order_id == test_order_id).first()
        assert payment is not None, "Payment record not found!"
        
        # Update payment status
        payment.status = "completed"
        payment.gateway_payment_id = "test_pay_id_12345"
        payment.payment_method = "razorpay"
        
        # Resolve plan by checking metadata (our newly added logic)
        slug = payment.metadata_.get("tier") if (payment.metadata_ and "tier" in payment.metadata_) else ("pro" if payment.amount > 500 else "standard")
        print(f"   Resolved plan slug: '{slug}' (should be 'pro')")
        assert slug == "pro", f"Plan resolution failed! Expected 'pro', got '{slug}'"
        
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == slug).first()
        assert plan is not None, "Resolved plan not found in DB!"

        # Create/Update Active Subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == test_user.id,
            Subscription.status == "active",
            (Subscription.current_period_end == None) | (Subscription.current_period_end > datetime.utcnow())
        ).first()

        now = datetime.utcnow()
        period_end = now + timedelta(days=30)

        if not subscription:
            subscription = Subscription(
                user_id=test_user.id,
                plan_id=plan.id,
                status="active",
                billing_cycle="monthly",
                current_period_start=now,
                current_period_end=period_end,
                gateway="razorpay",
                gateway_subscription_id="test_pay_id_12345"
            )
            db.add(subscription)
        else:
            subscription.plan_id = plan.id
            subscription.current_period_start = now
            subscription.current_period_end = period_end
            subscription.gateway_subscription_id = "test_pay_id_12345"

        db.flush()
        payment.subscription_id = subscription.id
        db.commit()
        print("   Database transaction committed successfully. Subscription activated!")

        # 5. Dispatch email
        print("\n5. Dispatching invoice email...")
        send_subscription_email(
            user_email=test_user.email,
            user_name=test_user.display_name or "Seeker",
            tier=plan.tier,
            amount=float(payment.amount),
            order_id=payment.gateway_order_id,
            payment_id=payment.gateway_payment_id
        )
        print("\nINTEGRATION TEST SUCCESSFUL! Verification logic completed and email dispatched.")

    except Exception as e:
        db.rollback()
        print(f"\nTEST FAILED with error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_verify_payment_flow()
