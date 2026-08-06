import os
import sys
import uuid
import secrets
from datetime import datetime, timedelta

# Add backend to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(project_root, "backend")
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from db import SessionLocal
from db.models.billing import AccessCampaign, SubscriptionPlan
from db.models.identity import User
import qrcode
import qrcode.image.svg

def create_and_save_campaign(name, plan_tier, duration_hours, max_redemptions):
    db = SessionLocal()
    try:
        # Resolve admin user
        admin_email = os.environ.get("ADMIN_EMAIL", "anmol dixit091@gmail.com")
        admin_user = db.query(User).filter(User.email == admin_email).first()
        admin_id = admin_user.id if admin_user else None
        
        # Verify plan exists
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == plan_tier).first()
        if not plan:
            from api.billing import seed_subscription_plans_if_needed
            try:
                seed_subscription_plans_if_needed(db)
                plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == plan_tier).first()
            except Exception as e:
                print(f"Warning: Could not seed plan: {e}")
                
        token = secrets.token_urlsafe(32)
        
        campaign = AccessCampaign(
            campaign_name=name,
            token=token,
            plan=plan_tier,
            duration_hours=duration_hours,
            max_redemptions=max_redemptions,
            starts_at=None,
            expires_at=None, # Active forever until limit reached
            is_active=True,
            created_by=admin_id
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        # Generate URLs
        custom_url = f"https://astrosutra.manasai.tech/redeem/{token}"
        render_url = f"https://astrosutraai.onrender.com/redeem/{token}"
        local_url = f"http://localhost:5173/redeem/{token}"
        
        factory = qrcode.image.svg.SvgPathImage
        
        # 1. Generate QR Code for Custom Domain
        qr_custom = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
            image_factory=factory
        )
        qr_custom.add_data(custom_url)
        qr_custom.make(fit=True)
        img_custom = qr_custom.make_image()
        
        # 2. Generate QR Code for Render Domain
        qr_render = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
            image_factory=factory
        )
        qr_render.add_data(render_url)
        qr_render.make(fit=True)
        img_render = qr_render.make_image()
        
        # Save SVG files
        output_dir = os.path.join(project_root, "scratch")
        os.makedirs(output_dir, exist_ok=True)
        
        campaign_slug = name.replace(' ', '_').lower()
        file_path_custom = os.path.join(output_dir, f"{campaign_slug}_custom_domain_qr.svg")
        file_path_render = os.path.join(output_dir, f"{campaign_slug}_render_domain_qr.svg")
        
        with open(file_path_custom, "wb") as f:
            img_custom.save(f)
            
        with open(file_path_render, "wb") as f:
            img_render.save(f)
            
        print(f"=== CAMPAIGN CREATION SUCCESS ===")
        print(f"Campaign Name   : {campaign.campaign_name}")
        print(f"Plan Tier       : {campaign.plan.upper()}")
        print(f"Duration        : {campaign.duration_hours} Hours")
        print(f"Max Limit       : {campaign.max_redemptions} Users")
        print(f"Token           : {campaign.token}")
        print(f"Custom Domain   : {custom_url}")
        print(f"Render Domain   : {render_url}")
        print(f"Local Testing   : {local_url}")
        print(f"QR Custom Saved : {file_path_custom}")
        print(f"QR Render Saved : {file_path_render}")
        print(f"=================================")
        
    finally:
        db.close()

if __name__ == "__main__":
    # Create the Pro Access 10 hours campaign
    create_and_save_campaign(
        name="Pro Access",
        plan_tier="pro",
        duration_hours=10,
        max_redemptions=100
    )
