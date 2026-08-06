import os
import sys
import uuid
from datetime import datetime, timedelta

# Add backend to path first
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(project_root, "backend")
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from db import SessionLocal
from db.models.billing import AccessCampaign, CampaignRedemption, Subscription, SubscriptionPlan
from db.models.identity import User
from api.campaign import generate_qr_base64_svg

def test_campaign_flow():
    print("=== TESTING CAMPAIGN BUSINESS LOGIC ===")
    
    db = SessionLocal()
    try:
        # 1. Retrieve or seed admin user
        admin_email = os.environ.get("ADMIN_EMAIL", "anmol dixit091@gmail.com")
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            # Create mock admin for testing
            admin_user = User(
                firebase_uid="mock_admin_uid",
                email=admin_email,
                display_name="Admin Seeker",
                status="active"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"[OK] Created mock admin user: {admin_email}")
        else:
            print(f"[OK] Found admin user: {admin_user.email}")
            
        # Delete existing campaign if left over from previous failed run
        test_token = "test_invite_token_123"
        db.query(AccessCampaign).filter(AccessCampaign.token == test_token).delete()
        db.commit()
        qr_data_uri = generate_qr_base64_svg(test_token)
        assert qr_data_uri.startswith("data:image/svg+xml;base64,")
        print("[OK] QR code SVG generated successfully (Base64 data URI).")
        
        # 3. Create test campaign
        campaign_name = "ITM Test Seminar"
        campaign = AccessCampaign(
            campaign_name=campaign_name,
            token=test_token,
            plan="pro",
            duration_hours=10,
            max_redemptions=5,
            starts_at=None,
            expires_at=datetime.utcnow() + timedelta(days=2),
            is_active=True,
            created_by=admin_user.id
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        print(f"[OK] Created test campaign: {campaign.campaign_name} with token: {campaign.token}")
        
        # 4. Test check token logic
        retrieved_campaign = db.query(AccessCampaign).filter(AccessCampaign.token == test_token).first()
        assert retrieved_campaign is not None
        assert retrieved_campaign.campaign_name == campaign_name
        assert retrieved_campaign.is_active is True
        print("[OK] Campaign check-token database lookup succeeded.")
        
        # 5. Simulate User Redemption
        # Find or create a test user
        test_user_email = "test_user_redemption@astrosutra.ai"
        test_user = db.query(User).filter(User.email == test_user_email).first()
        if not test_user:
            test_user = User(
                firebase_uid="mock_test_user_uid",
                email=test_user_email,
                display_name="Test Seeker",
                status="active"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"[OK] Created test user: {test_user.email}")
        else:
            print(f"[OK] Found existing test user: {test_user.email}")
            
        # Clear existing active subscriptions for this test user to make it repeatable
        db.query(Subscription).filter(
            Subscription.user_id == test_user.id
        ).delete()
        db.query(CampaignRedemption).filter(
            CampaignRedemption.user_id == test_user.id
        ).delete()
        db.commit()
        
        # Simulate redemption logic
        # 5.1 Seed plans if not exist
        from api.billing import seed_subscription_plans_if_needed
        seed_subscription_plans_if_needed(db)
        pro_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "pro").first()
        assert pro_plan is not None, "Pro subscription plan should exist."
        
        # 5.2 Create redemption
        expires_at = datetime.utcnow() + timedelta(hours=campaign.duration_hours)
        redemption = CampaignRedemption(
            campaign_id=campaign.id,
            user_id=test_user.id,
            redeemed_at=datetime.utcnow(),
            access_expires_at=expires_at,
            status="active"
        )
        db.add(redemption)
        
        # 5.3 Create subscription
        sub = Subscription(
            user_id=test_user.id,
            plan_id=pro_plan.id,
            status="active",
            billing_cycle="monthly",
            current_period_start=datetime.utcnow(),
            current_period_end=expires_at,
            gateway="campaign",
            metadata_={
                "campaign_id": str(campaign.id),
                "campaign_name": campaign.campaign_name,
                "temporary": True
            }
        )
        db.add(sub)
        
        # 5.4 Increment count
        campaign.redeemed_count += 1
        db.commit()
        
        print("[OK] Simulated campaign redemption succeeded database validation.")
        
        # Verify active subscription logic checks expiration
        from api.auth import get_user_subscription_tier, get_user_subscription_expiry
        tier = get_user_subscription_tier(db, test_user.id)
        expiry = get_user_subscription_expiry(db, test_user.id)
        assert tier == "pro"
        assert expiry is not None
        print(f"[OK] get_user_subscription_tier returned '{tier}' with expiry: {expiry}")
        
        # Simulate Expiration
        sub.current_period_end = datetime.utcnow() - timedelta(minutes=5)
        db.commit()
        
        expired_tier = get_user_subscription_tier(db, test_user.id)
        expired_expiry = get_user_subscription_expiry(db, test_user.id)
        assert expired_tier == "free"
        assert expired_expiry is None
        print(f"[OK] get_user_subscription_tier properly returned '{expired_tier}' after expiration boundary passed.")
        
        # Clean up
        db.delete(sub)
        db.delete(redemption)
        db.delete(campaign)
        db.commit()
        print("[OK] Test data cleanup completed successfully.")
        print("=== ALL TESTS PASSED SUCCESSFULLY! ===")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_campaign_flow()
