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

def list_active_redemptions():
    db = SessionLocal()
    try:
        query = db.query(
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
        
        print("\n=======================================================")
        print("                 CAMPAIGN USER REDEMPTIONS             ")
        print("=======================================================")
        
        if not redemptions:
            print("No users have redeemed any QR codes yet.")
        else:
            print(f"{'User Email':<35} | {'Campaign':<18} | {'Tier':<5} | {'Redeemed At (UTC)':<19} | {'Expires At (UTC)':<19} | {'Status'}")
            print("-" * 115)
            for r in redemptions:
                redeemed_str = r.redeemed_at.strftime("%Y-%m-%d %H:%M:%S")
                expires_str = r.access_expires_at.strftime("%Y-%m-%d %H:%M:%S")
                print(f"{r.email:<35} | {r.campaign_name:<18} | {r.plan.upper():<5} | {redeemed_str:<19} | {expires_str:<19} | {r.status}")
                
        print("=======================================================\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    list_active_redemptions()
