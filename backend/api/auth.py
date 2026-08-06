import os
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from core.auth import require_current_user, verify_firebase_token
from db import get_db
from db.models.identity import User, UserPreference
from db.models.authorization import Role, UserRole

router = APIRouter()

class TokenVerifyRequest(BaseModel):
    token: str

@router.post("/auth/verify")
def verify_token_endpoint(req: TokenVerifyRequest, db: Session = Depends(get_db)):
    """
    Endpoint for verifying Firebase ID token, provisioning the user in PostgreSQL
    if they are signing in for the first time, and returning profile details.
    """
    # 1. Verify Firebase Token
    claims = verify_firebase_token(req.token)
    if not claims or "uid" not in claims:
        raise HTTPException(status_code=401, detail="Invalid Firebase Token")

    firebase_uid = claims["uid"]
    email = claims.get("email")
    display_name = claims.get("name", "Astro User")

    # 2. Check if user already exists in platform.users
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    if not user:
        # Check if email is already in use by a legacy account without firebase_uid linked
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Link Firebase account to the existing profile
                user.firebase_uid = firebase_uid
                user.display_name = user.display_name or display_name
                user.last_login_at = datetime.utcnow()
                db.commit()
                print(f"Linked existing email {email} to Firebase UID {firebase_uid}")

        if not user:
            # Create new user record
            user = User(
                firebase_uid=firebase_uid,
                email=email or f"firebase_{firebase_uid}@astrosutra.ai",
                display_name=display_name,
                email_verified=claims.get("email_verified", False),
                status="active",
                last_login_at=datetime.utcnow()
            )
            db.add(user)
            db.flush() # Populate user.id

            # Create User Preferences record
            prefs = UserPreference(user_id=user.id)
            db.add(prefs)

            # Assign Role based on configured ADMIN_EMAIL env variable
            admin_email = os.environ.get("ADMIN_EMAIL", "anmol dixit091@gmail.com")
            role_name = "admin" if email == admin_email else "user"
            
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                user_role = UserRole(user_id=user.id, role_id=role.id, granted_by=user.id)
                db.add(user_role)

            db.commit()
            print(f"Created new user profile in database for {email} with role: {role_name}")
    else:
        # Update last login timestamp
        user.last_login_at = datetime.utcnow()
        db.commit()

    return {
        "success": True,
        "firebase_user": claims,
        "db_user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "status": user.status,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "subscription_tier": get_user_subscription_tier(db, user.id),
            "subscription_expires_at": get_user_subscription_expiry(db, user.id)
        }
    }

def get_user_subscription_tier(db: Session, user_id) -> str:
    from db.models.billing import Subscription, SubscriptionPlan
    from api.billing import seed_subscription_plans_if_needed
    try:
        seed_subscription_plans_if_needed(db)
    except Exception as e:
        print(f"[Auth Service] Suppressed plan seeding warning: {e}")
        
    sub = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "active",
        (Subscription.current_period_end == None) | (Subscription.current_period_end > datetime.utcnow())
    ).first()
    if sub:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
        if plan:
            return plan.tier
    return "free"

def get_user_subscription_expiry(db: Session, user_id) -> Optional[str]:
    from db.models.billing import Subscription
    sub = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "active",
        (Subscription.current_period_end == None) | (Subscription.current_period_end > datetime.utcnow())
    ).first()
    if sub and sub.current_period_end:
        return sub.current_period_end.isoformat() + "Z"
    return None

@router.get("/auth/me")
def get_me(
    firebase_user: Dict[str, Any] = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Protected endpoint returning both Firebase claims and Database profile details."""
    firebase_uid = firebase_user["uid"]
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile not synced in database")

    return {
        "success": True,
        "firebase_user": firebase_user,
        "db_user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "status": user.status,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "subscription_tier": get_user_subscription_tier(db, user.id),
            "subscription_expires_at": get_user_subscription_expiry(db, user.id)
        }
    }

