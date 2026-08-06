"""
Exposes all SQLAlchemy ORM models for Alembic discovery.
"""

from db.base import Base
from db.models.identity import User, AuthProvider, UserProfile, UserPreference
from db.models.authorization import Role, Permission, RolePermission, UserRole
from db.models.products import Product, UserProduct, ProductFeature
from db.models.astrology import (
    AstroProfile, AstroBirthDetails, AstroChart, AstroPlanetPosition,
    AstroHouse, AstroYoga, AstroDosha, AstroDasha, AstroDivisionalChart
)
from db.models.ai_chat import ChatSession, ChatMessage, ChatFeedback
from db.models.reports import AIReport
from db.models.billing import SubscriptionPlan, Subscription, Payment, AccessCampaign, CampaignRedemption
from db.models.storage import FileAsset
from db.models.notifications import Notification
from db.models.analytics import UserAnalyticsEvent, AIAnalytics
from db.models.audit import AuditLog

__all__ = [
    "Base",
    "User",
    "AuthProvider",
    "UserProfile",
    "UserPreference",
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "Product",
    "UserProduct",
    "ProductFeature",
    "AstroProfile",
    "AstroBirthDetails",
    "AstroChart",
    "AstroPlanetPosition",
    "AstroHouse",
    "AstroYoga",
    "AstroDosha",
    "AstroDasha",
    "AstroDivisionalChart",
    "ChatSession",
    "ChatMessage",
    "ChatFeedback",
    "AIReport",
    "SubscriptionPlan",
    "Subscription",
    "Payment",
    "AccessCampaign",
    "CampaignRedemption",
    "FileAsset",
    "Notification",
    "UserAnalyticsEvent",
    "AIAnalytics",
    "AuditLog",
]
