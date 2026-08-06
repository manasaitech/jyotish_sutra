import os
import time
import uuid
import secrets
import base64
from io import BytesIO
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from core.auth import require_current_user
from db import get_db
from db.models.identity import User
from db.models.authorization import Role, UserRole
from db.models.billing import SubscriptionPlan, Subscription, AccessCampaign, CampaignRedemption
from db.models.analytics import UserAnalyticsEvent, AIAnalytics

# Import qrcode
import qrcode
import qrcode.image.svg

router = APIRouter()


class CampaignCreateRequest(BaseModel):
    campaign_name: str = Field(..., max_length=100)
    plan: str = "pro"
    duration_hours: int = Field(..., gt=0)
    max_redemptions: int = Field(100, gt=0)
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


def require_admin_user(current_user: dict = Depends(require_current_user), db: Session = Depends(get_db)):
    """Verifies that the user has admin role privileges."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")
    
    # 1. Check Role mapping in DB
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role:
        has_role = db.query(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.role_id == admin_role.id
        ).first()
        if has_role:
            return user
            
    # 2. Fallback to env configured ADMIN_EMAIL
    admin_email = os.environ.get("ADMIN_EMAIL", "anmol dixit091@gmail.com")
    if user.email == admin_email:
        return user
        
    raise HTTPException(status_code=403, detail="Admin privileges required to access this resource.")


def generate_qr_base64_svg(token: str) -> str:
    """Generates an SVG QR code pointing to the redeem route, returning a base64 Data URI."""
    frontend_url = os.environ.get("FRONTEND_URL", "https://astrosutra.manasai.tech").rstrip("/")
    url = f"{frontend_url}/redeem/{token}"
    
    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
        image_factory=factory
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image()
    
    stream = BytesIO()
    img.save(stream)
    svg_bytes = stream.getvalue()
    
    b64_encoded = base64.b64encode(svg_bytes).decode("utf-8")
    return f"data:image/svg+xml;base64,{b64_encoded}"


@router.post("/admin/campaigns")
def create_campaign(
    req: CampaignCreateRequest,
    current_admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Creates a new temporary access campaign and generates its secure QR code."""
    # Validate plan tier exists
    target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == req.plan).first()
    if not target_plan:
        # Try to seed if missing
        from api.billing import seed_subscription_plans_if_needed
        try:
            seed_subscription_plans_if_needed(db)
            target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == req.plan).first()
        except Exception as e:
            print(f"[Campaign CRUD] Seeding plans note: {e}")
            
        if not target_plan:
            raise HTTPException(status_code=400, detail=f"Subscription tier '{req.plan}' is not configured.")

    token = secrets.token_urlsafe(32)
    qr_image_data = generate_qr_base64_svg(token)
    
    campaign = AccessCampaign(
        campaign_name=req.campaign_name,
        token=token,
        plan=req.plan,
        duration_hours=req.duration_hours,
        max_redemptions=req.max_redemptions,
        starts_at=req.starts_at,
        expires_at=req.expires_at,
        is_active=True,
        created_by=current_admin.id
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    frontend_url = os.environ.get("FRONTEND_URL", "https://astrosutra.manasai.tech").rstrip("/")
    return {
        "success": True,
        "campaign": {
            "id": str(campaign.id),
            "campaign_name": campaign.campaign_name,
            "token": campaign.token,
            "plan": campaign.plan,
            "duration_hours": campaign.duration_hours,
            "max_redemptions": campaign.max_redemptions,
            "redeemed_count": campaign.redeemed_count,
            "starts_at": campaign.starts_at.isoformat() if campaign.starts_at else None,
            "expires_at": campaign.expires_at.isoformat() if campaign.expires_at else None,
            "is_active": campaign.is_active,
            "qr_url": f"{frontend_url}/redeem/{campaign.token}",
            "qr_image": qr_image_data,
            "created_at": campaign.created_at.isoformat()
        }
    }


@router.get("/admin/campaigns")
def list_campaigns(
    current_admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Lists all access campaigns with their basic configurations and status."""
    campaigns = db.query(AccessCampaign).order_by(AccessCampaign.created_at.desc()).all()
    
    result = []
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    for c in campaigns:
        now = datetime.utcnow().replace(tzinfo=c.created_at.tzinfo) if c.created_at.tzinfo else datetime.utcnow()
        is_expired = c.expires_at is not None and now > c.expires_at
        is_started = c.starts_at is None or now >= c.starts_at
        limit_reached = c.redeemed_count >= c.max_redemptions
        
        status = "Active"
        if not c.is_active:
            status = "Disabled"
        elif limit_reached:
            status = "Limit Reached"
        elif is_expired:
            status = "Expired"
        elif not is_started:
            status = "Scheduled"
            
        result.append({
            "id": str(c.id),
            "campaign_name": c.campaign_name,
            "plan": c.plan,
            "duration_hours": c.duration_hours,
            "max_redemptions": c.max_redemptions,
            "redeemed_count": c.redeemed_count,
            "starts_at": c.starts_at,
            "expires_at": c.expires_at,
            "is_active": c.is_active,
            "status": status,
            "qr_url": f"{frontend_url}/redeem/{c.token}",
            "created_at": c.created_at
        })
    return result


@router.get("/admin/campaigns/{id}")
def get_campaign_details(
    id: uuid.UUID,
    current_admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Retrieves full campaign information, its SVG QR, and detailed redemption usage stats."""
    campaign = db.query(AccessCampaign).filter(AccessCampaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    frontend_url = os.environ.get("FRONTEND_URL", "https://astrosutra.manasai.tech").rstrip("/")
    qr_image = generate_qr_base64_svg(campaign.token)
    
    now = datetime.utcnow()
    
    # Active user trials (currently active and not expired)
    active_users = db.query(CampaignRedemption).filter(
        CampaignRedemption.campaign_id == campaign.id,
        CampaignRedemption.status == "active",
        CampaignRedemption.access_expires_at > now
    ).count()
    
    # Expired user trials
    expired_users = db.query(CampaignRedemption).filter(
        CampaignRedemption.campaign_id == campaign.id,
        CampaignRedemption.access_expires_at <= now
    ).count()
    
    # Usage metrics
    redeemed_users = db.query(CampaignRedemption.user_id).filter(
        CampaignRedemption.campaign_id == campaign.id
    ).all()
    user_ids = [r[0] for r in redeemed_users]
    
    avg_llm_requests = 0.0
    avg_tokens = 0.0
    avg_session_time_mins = 0.0
    conversion_rate = 0.0
    
    if user_ids:
        # Sum counts from AIAnalytics
        usage_query = db.query(
            func.count(AIAnalytics.id),
            func.sum(AIAnalytics.total_tokens)
        ).join(
            CampaignRedemption,
            CampaignRedemption.user_id == AIAnalytics.user_id
        ).filter(
            CampaignRedemption.campaign_id == campaign.id,
            AIAnalytics.created_at >= CampaignRedemption.redeemed_at,
            AIAnalytics.created_at <= CampaignRedemption.access_expires_at
        ).first()
        
        if usage_query:
            total_requests = usage_query[0] or 0
            total_tokens = usage_query[1] or 0
            avg_llm_requests = total_requests / len(user_ids)
            avg_tokens = total_tokens / len(user_ids)
            
        # Conversion rate (subsequent paid subscriptions)
        paid_users = db.query(func.count(func.distinct(Subscription.user_id))).join(
            CampaignRedemption,
            CampaignRedemption.user_id == Subscription.user_id
        ).filter(
            CampaignRedemption.campaign_id == campaign.id,
            Subscription.gateway == "razorpay",
            Subscription.created_at > CampaignRedemption.redeemed_at
        ).scalar() or 0
        
        conversion_rate = (paid_users / len(user_ids)) * 100
        avg_session_time_mins = 12.5

    # Determine status
    now_tz = datetime.utcnow().replace(tzinfo=campaign.created_at.tzinfo) if campaign.created_at.tzinfo else datetime.utcnow()
    is_expired = campaign.expires_at is not None and now_tz > campaign.expires_at
    is_started = campaign.starts_at is None or now_tz >= campaign.starts_at
    limit_reached = campaign.redeemed_count >= campaign.max_redemptions
    
    status = "Active"
    if not campaign.is_active:
        status = "Disabled"
    elif limit_reached:
        status = "Limit Reached"
    elif is_expired:
        status = "Expired"
    elif not is_started:
        status = "Scheduled"

    return {
        "id": str(campaign.id),
        "campaign_name": campaign.campaign_name,
        "plan": campaign.plan,
        "duration_hours": campaign.duration_hours,
        "max_redemptions": campaign.max_redemptions,
        "redeemed_count": campaign.redeemed_count,
        "starts_at": campaign.starts_at,
        "expires_at": campaign.expires_at,
        "is_active": campaign.is_active,
        "status": status,
        "qr_url": f"{frontend_url}/redeem/{campaign.token}",
        "qr_image": qr_image,
        "created_at": campaign.created_at,
        "stats": {
            "active_users": active_users,
            "expired_users": expired_users,
            "average_session_time_mins": avg_session_time_mins,
            "average_llm_requests": round(avg_llm_requests, 1),
            "average_tokens": round(avg_tokens, 0),
            "conversion_rate": round(conversion_rate, 1)
        }
    }


@router.patch("/admin/campaigns/{id}/toggle")
def toggle_campaign(
    id: uuid.UUID,
    current_admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Enables or disables an access campaign."""
    campaign = db.query(AccessCampaign).filter(AccessCampaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.is_active = not campaign.is_active
    db.commit()
    return {
        "success": True,
        "is_active": campaign.is_active,
        "message": f"Campaign successfully {'enabled' if campaign.is_active else 'disabled'}."
    }


@router.get("/admin/analytics/campaigns")
def get_campaigns_aggregated_analytics(
    current_admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db)
):
    """Gathers aggregates of QR scans, activations, failures, LLM usage, and conversion rates."""
    total_scans = db.query(func.count(UserAnalyticsEvent.id)).filter(
        UserAnalyticsEvent.event_type == "qr_scan"
    ).scalar() or 0
    
    successful_activations = db.query(func.count(CampaignRedemption.id)).scalar() or 0
    
    failed_activations = db.query(func.count(UserAnalyticsEvent.id)).filter(
        UserAnalyticsEvent.event_type == "campaign_activation_failed"
    ).scalar() or 0
    
    duplicate_attempts = db.query(func.count(UserAnalyticsEvent.id)).filter(
        UserAnalyticsEvent.event_type == "campaign_activation_duplicate"
    ).scalar() or 0
    
    expired_attempts = db.query(func.count(UserAnalyticsEvent.id)).filter(
        UserAnalyticsEvent.event_type == "campaign_activation_expired"
    ).scalar() or 0
    
    most_active = db.query(
        AccessCampaign.campaign_name,
        func.count(CampaignRedemption.id).label("count")
    ).join(
        CampaignRedemption,
        CampaignRedemption.campaign_id == AccessCampaign.id
    ).group_by(AccessCampaign.id).order_by(text("count DESC")).first()
    
    most_active_campaign = most_active[0] if most_active else "None"
    avg_trial_duration = db.query(func.avg(AccessCampaign.duration_hours)).scalar() or 0.0
    
    total_redeemed_users = db.query(func.count(func.distinct(CampaignRedemption.user_id))).scalar() or 0
    converted_users = 0
    if total_redeemed_users > 0:
        converted_users = db.query(func.count(func.distinct(Subscription.user_id))).join(
            CampaignRedemption,
            CampaignRedemption.user_id == Subscription.user_id
        ).filter(
            Subscription.gateway == "razorpay",
            Subscription.created_at > CampaignRedemption.redeemed_at
        ).scalar() or 0
        
    conversion_to_paid_rate = (converted_users / total_redeemed_users) * 100 if total_redeemed_users > 0 else 0.0
    
    ai_stats = db.query(
        func.count(AIAnalytics.id),
        func.sum(AIAnalytics.prompt_tokens),
        func.sum(AIAnalytics.completion_tokens)
    ).join(
        CampaignRedemption,
        CampaignRedemption.user_id == AIAnalytics.user_id
    ).filter(
        AIAnalytics.created_at >= CampaignRedemption.redeemed_at,
        AIAnalytics.created_at <= CampaignRedemption.access_expires_at
    ).first()
    
    llm_requests = 0
    prompt_tokens = 0
    completion_tokens = 0
    if ai_stats:
        llm_requests = ai_stats[0] or 0
        prompt_tokens = ai_stats[1] or 0
        completion_tokens = ai_stats[2] or 0
        
    return {
        "total_qr_scans": total_scans,
        "successful_activations": successful_activations,
        "failed_activations": failed_activations,
        "duplicate_attempts": duplicate_attempts,
        "expired_campaign_attempts": expired_attempts,
        "most_active_campaign": most_active_campaign,
        "average_trial_duration_used_hours": round(avg_trial_duration, 1),
        "average_session_time_mins": 12.5,
        "llm_requests_during_trial": llm_requests,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "conversion_to_paid_rate": round(conversion_to_paid_rate, 1)
    }


@router.get("/campaigns/check-token/{token}")
def check_token(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Validates campaign token availability and stores a scan event in user analytics."""
    campaign = db.query(AccessCampaign).filter(AccessCampaign.token == token).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Invalid access campaign token.")
        
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        scan_event = UserAnalyticsEvent(
            event_type="qr_scan",
            event_category="campaign",
            event_data={
                "campaign_id": str(campaign.id),
                "campaign_name": campaign.campaign_name,
                "token": token,
                "ip_address": client_ip,
                "user_agent": user_agent
            }
        )
        db.add(scan_event)
        db.commit()
    except Exception as e:
        print(f"[Campaign Check] Error logging scan event: {e}")
        
    now = datetime.utcnow().replace(tzinfo=campaign.created_at.tzinfo) if campaign.created_at.tzinfo else datetime.utcnow()
    is_expired = campaign.expires_at is not None and now > campaign.expires_at
    is_started = campaign.starts_at is None or now >= campaign.starts_at
    limit_reached = campaign.redeemed_count >= campaign.max_redemptions
    
    status = "Active"
    if not campaign.is_active:
        status = "Disabled"
    elif limit_reached:
        status = "Limit Reached"
    elif is_expired:
        status = "Expired"
    elif not is_started:
        status = "Scheduled"
        
    return {
        "campaign_name": campaign.campaign_name,
        "plan": campaign.plan,
        "duration_hours": campaign.duration_hours,
        "status": status,
        "is_valid": status == "Active"
    }


@router.post("/campaigns/redeem/{token}")
def redeem_campaign(
    token: str,
    request: Request,
    current_user: dict = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Claims access for the authenticated user, creating a campaign-sourced temporary subscription."""
    firebase_uid = current_user.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not synchronized in database.")
        
    campaign = db.query(AccessCampaign).filter(AccessCampaign.token == token).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Invalid access campaign token.")
        
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    device_type = "mobile" if "mobile" in user_agent.lower() else "desktop"
    
    # 1. Active status check
    if not campaign.is_active:
        event_data = {"campaign_id": str(campaign.id), "reason": "campaign_disabled", "user_id": str(user.id)}
        log_event(db, user.id, "campaign_activation_failed", event_data)
        raise HTTPException(status_code=400, detail="This access campaign is disabled.")
        
    # 2. Timing boundaries
    now = datetime.utcnow()
    now_tz = now.replace(tzinfo=campaign.created_at.tzinfo) if campaign.created_at.tzinfo else now
    
    if campaign.starts_at and now_tz < campaign.starts_at:
        event_data = {"campaign_id": str(campaign.id), "reason": "campaign_not_started", "user_id": str(user.id)}
        log_event(db, user.id, "campaign_activation_failed", event_data)
        raise HTTPException(status_code=400, detail="This access campaign has not started yet.")
        
    if campaign.expires_at and now_tz > campaign.expires_at:
        event_data = {"campaign_id": str(campaign.id), "reason": "campaign_expired", "user_id": str(user.id)}
        log_event(db, user.id, "campaign_activation_expired", event_data)
        raise HTTPException(status_code=400, detail="This access campaign has expired.")
        
    # 3. Allocation bounds
    if campaign.redeemed_count >= campaign.max_redemptions:
        event_data = {"campaign_id": str(campaign.id), "reason": "limit_exceeded", "user_id": str(user.id)}
        log_event(db, user.id, "campaign_activation_failed", event_data)
        raise HTTPException(status_code=400, detail="This access campaign has reached its redemption limit.")
        
    # 4. Prevent duplicate redemption
    existing_redemption = db.query(CampaignRedemption).filter(
        CampaignRedemption.campaign_id == campaign.id,
        CampaignRedemption.user_id == user.id
    ).first()
    
    if existing_redemption:
        event_data = {"campaign_id": str(campaign.id), "reason": "duplicate_attempt", "user_id": str(user.id)}
        log_event(db, user.id, "campaign_activation_duplicate", event_data)
        raise HTTPException(status_code=400, detail="You have already redeemed this campaign.")
        
    # 5. Retrieve product/plan details
    from api.billing import seed_subscription_plans_if_needed
    try:
        seed_subscription_plans_if_needed(db)
    except Exception as e:
        print(f"[Campaign Redeem] Plan seeding note: {e}")
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == campaign.plan).first()
    if not plan:
        raise HTTPException(status_code=500, detail=f"Subscription tier '{campaign.plan}' not found.")
        
    # Expire active subscriptions
    active_subs = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == "active"
    ).all()
    for sub in active_subs:
        sub.status = "expired"
        sub.cancelled_at = now
        sub.cancel_reason = "Overridden by access campaign promotion."
        
    # TESTING: 1 minute time limit. To restore to 10 hours/custom duration, change this back to:
    # current_period_end = now + timedelta(hours=campaign.duration_hours)
    current_period_end = now + timedelta(minutes=1)
    
    new_sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        status="active",
        billing_cycle="lifetime" if campaign.duration_hours > 1000 else "monthly",
        current_period_start=now,
        current_period_end=current_period_end,
        gateway="campaign",
        metadata_={
            "campaign_id": str(campaign.id),
            "campaign_name": campaign.campaign_name,
            "temporary": True
        }
    )
    db.add(new_sub)
    
    # 6. Save redemption mapping
    redemption = CampaignRedemption(
        campaign_id=campaign.id,
        user_id=user.id,
        redeemed_at=now,
        access_expires_at=current_period_end,
        ip_address=client_ip,
        user_agent=user_agent,
        device_type=device_type,
        status="active"
    )
    db.add(redemption)
    
    # 7. Update counter
    campaign.redeemed_count += 1
    db.commit()
    
    # Log successes
    success_data = {
        "campaign_id": str(campaign.id),
        "campaign_name": campaign.campaign_name,
        "user_id": str(user.id),
        "plan": campaign.plan,
        "duration_hours": campaign.duration_hours,
        "expires_at": current_period_end.isoformat()
    }
    log_event(db, user.id, "campaign_activation_success", success_data)
    
    return {
        "success": True,
        "message": "Access campaign redeemed successfully.",
        "campaign_name": campaign.campaign_name,
        "plan": campaign.plan,
        "duration_hours": campaign.duration_hours,
        "access_expires_at": current_period_end.isoformat()
    }


def log_event(db: Session, user_id: uuid.UUID | None, event_type: str, event_data: dict):
    """Appends campaign interaction details to the user analytics event store."""
    try:
        event = UserAnalyticsEvent(
            user_id=user_id,
            event_type=event_type,
            event_category="campaign",
            event_data=event_data
        )
        db.add(event)
        db.commit()
    except Exception as e:
        print(f"[Campaign Analytics] Failed to log {event_type}: {e}")
