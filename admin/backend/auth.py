"""
Admin Dashboard — Authentication Guard.

Verifies Firebase Bearer token and checks that the user has the 'admin' role
in the authz.user_roles + authz.roles tables.
"""

import os
import sys
from typing import Dict, Any, Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from db import get_db

# Add main project paths so we can import Firebase auth utilities
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
backend_dir = os.path.join(project_root, "backend")
sys.path.insert(0, backend_dir)
sys.path.insert(0, project_root)

from core.auth import verify_firebase_token


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")


def _is_admin_by_role(db: Session, firebase_uid: str) -> bool:
    """Check if user has 'admin' role in authz schema."""
    result = db.execute(text("""
        SELECT r.name
        FROM authz.user_roles ur
        JOIN authz.roles r ON r.id = ur.role_id
        JOIN platform.users u ON u.id = ur.user_id
        WHERE u.firebase_uid = :uid
    """), {"uid": firebase_uid})
    roles = [row[0] for row in result]
    return "admin" in roles


def _is_admin_by_email(email: str) -> bool:
    """Fallback: check if the email matches ADMIN_EMAIL env var."""
    if not ADMIN_EMAIL:
        return False
    return email.lower().strip() == ADMIN_EMAIL.lower().strip()


def get_admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    FastAPI dependency that:
    1. Extracts Bearer token from Authorization header
    2. Verifies it via Firebase Admin SDK
    3. Confirms the user has the 'admin' role
    Returns 401 if unauthenticated, 403 if not admin.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required.")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header.")

    token = parts[1]
    try:
        claims = verify_firebase_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    if not claims or "uid" not in claims:
        raise HTTPException(status_code=401, detail="Invalid token claims.")

    firebase_uid = claims["uid"]
    email = claims.get("email", "")

    # Check admin access via RBAC roles OR env email fallback
    is_admin = _is_admin_by_role(db, firebase_uid) or _is_admin_by_email(email)

    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )

    return {
        "uid": firebase_uid,
        "email": email,
        "name": claims.get("name", "Admin"),
    }
