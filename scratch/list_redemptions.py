import os
import sys
from datetime import datetime

# Add backend to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(project_root, "backend")
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from db import SessionLocal
from db.models.billing import CampaignRedemption, AccessCampaign
from db.models.identity import User
from db.models.analytics import AIAnalytics
from sqlalchemy import func

def list_active_redemptions():
    db = SessionLocal()
    try:
        query = db.query(
            CampaignRedemption.user_id,
            CampaignRedemption.redeemed_at,
            CampaignRedemption.access_expires_at,
            CampaignRedemption.status,
            User.email,
            AccessCampaign.campaign_name,
            AccessCampaign.plan
        ).join(
            User, User.id == CampaignRedemption.user_id
        ).join(
            AccessCampaign, AccessCampaign.id == CampaignRedemption.campaign_id
        ).order_by(CampaignRedemption.redeemed_at.desc())
        
        redemptions = query.all()
        
        print("\n===========================================================================================================")
        print("                                       CAMPAIGN USER REDEMPTIONS                                           ")
        print("===========================================================================================================")
        
        if not redemptions:
            print("No users have redeemed any QR codes yet.")
        else:
            print(f"{'User Email':<35} | {'Campaign':<18} | {'Tier':<5} | {'Redeemed At (UTC)':<19} | {'Expires At (UTC)':<19} | {'Queries':<7} | {'Status'}")
            print("-" * 123)
            for r in redemptions:
                # Count AI requests made during the promotional period
                queries_count = db.query(func.count(AIAnalytics.id)).filter(
                    AIAnalytics.user_id == r.user_id,
                    AIAnalytics.created_at >= r.redeemed_at,
                    AIAnalytics.created_at <= r.access_expires_at
                ).scalar() or 0
                
                redeemed_str = r.redeemed_at.strftime("%Y-%m-%d %H:%M:%S")
                expires_str = r.access_expires_at.strftime("%Y-%m-%d %H:%M:%S")
                print(f"{r.email:<35} | {r.campaign_name:<18} | {r.plan.upper():<5} | {redeemed_str:<19} | {expires_str:<19} | {queries_count:<7} | {r.status}")
                
        print("===========================================================================================================\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    list_active_redemptions()
