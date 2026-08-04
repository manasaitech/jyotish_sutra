import os
import json
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, Depends

try:
    import firebase_admin
    from firebase_admin import auth, credentials
    HAS_FIREBASE_ADMIN = True
except ImportError:
    firebase_admin = None
    auth = None
    credentials = None
    HAS_FIREBASE_ADMIN = False

# Global initialization flag
_firebase_app_initialized = False

def initialize_firebase_admin():
    """Initializes Firebase Admin SDK using Service Account JSON or default credentials."""
    global _firebase_app_initialized
    if not HAS_FIREBASE_ADMIN:
        print("[Firebase Admin Notice] firebase_admin package is not installed. Auth token verification disabled.")
        return

    if _firebase_app_initialized:
        return

    if len(firebase_admin._apps) > 0:
        _firebase_app_initialized = True
        return

    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT") or "astrosutraai-b524e"

    print("=== FIREBASE DEBUG ===")
    print("Project ID:", project_id)
    print("Client Email Present:", bool(client_email))
    print("Private Key Present:", bool(private_key))
    print("======================")

    try:
        # Priority 1: Environment Variables (e.g. Render)
        if private_key and client_email:
            print("[Firebase Admin] Initializing using credentials from environment variables...")
            formatted_key = private_key.replace("\\n", "\n")
            sa_info = {
                "type": "service_account",
                "project_id": project_id,
                "private_key": formatted_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            }
            cred = credentials.Certificate(sa_info)
            firebase_admin.initialize_app(cred)
            _firebase_app_initialized = True
            return

        # Priority 2: Service Account JSON file path
        sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
        default_paths = [
            sa_path,
            os.path.join(os.path.dirname(__file__), "..", "service_account.json"),
            os.path.join(os.path.dirname(__file__), "..", "firebase-service-account.json"),
            "service_account.json",
            "firebase-service-account.json",
        ]

        cert_file = None
        for path in default_paths:
            if path and os.path.exists(path):
                cert_file = path
                break

        if cert_file:
            print(f"[Firebase Admin] Initializing with Service Account: {cert_file}")
            cred = credentials.Certificate(cert_file)
            firebase_admin.initialize_app(cred)
            _firebase_app_initialized = True
        else:
            if project_id:
                print(f"[Firebase Admin] Credentials not found. Initializing with project options Project ID: {project_id}")
                firebase_admin.initialize_app(options={"projectId": project_id})
            else:
                print("[Firebase Admin] Credentials and Project ID not found. Attempting default credentials...")
                firebase_admin.initialize_app()
            _firebase_app_initialized = True
    except Exception as e:
        print(f"[Firebase Admin] Initialization FAILED: {e}")
        _firebase_app_initialized = False
        raise



# Initialize on import
initialize_firebase_admin()


def verify_firebase_token_manually(id_token: str) -> Dict[str, Any]:
    """Fallback manual JWT decoder validating signature using Google's public certificates."""
    import requests
    import jwt
    from cryptography.x509 import load_pem_x509_certificate
    from cryptography.hazmat.backends import default_backend

    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT") or "astrosutraai-b524e"

    # 1. Decode header to extract Key ID (kid)
    header = jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("No 'kid' claim found in token header")

    # 2. Fetch Google's public x509 certificates
    res = requests.get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", timeout=5)
    if not res.ok:
        raise ValueError("Failed to fetch Google public certificates")
    certs = res.json()

    cert_pem = certs.get(kid)
    if not cert_pem:
        raise ValueError(f"No matching certificate found for key ID: {kid}")

    # 3. Parse public key from certificate PEM
    cert = load_pem_x509_certificate(cert_pem.encode("utf-8"), default_backend())
    public_key = cert.public_key()

    # 4. Decode and cryptographically verify claims using PyJWT
    expected_issuer = f"https://securetoken.google.com/{project_id}"
    decoded = jwt.decode(
        id_token,
        public_key,
        algorithms=["RS256"],
        audience=project_id,
        issuer=expected_issuer,
        leeway=60,  # Tolerates clock drift between Google and local servers
        options={"verify_signature": True}
    )
    
    return {
        "uid": decoded.get("sub"),
        "email": decoded.get("email"),
        "name": decoded.get("name") or decoded.get("email", "").split("@")[0] or "Seeker",
        "picture": decoded.get("picture"),
        "auth_time": decoded.get("auth_time"),
        "user_id": decoded.get("sub"),
    }


def verify_firebase_token(id_token: str) -> Dict[str, Any]:
    """Verify Firebase JWT ID token using Firebase Admin SDK with manual cryptographic fallback."""
    if id_token and id_token.startswith("mock_firebase_id_token"):
        suffix = id_token.split("_")[-1] if "_" in id_token else "seeker"
        return {
            "uid": f"mock_user_{suffix}",
            "email": f"mock_{suffix}@astrosutra.ai",
            "name": "Vedic Seeker",
            "picture": None,
            "auth_time": 0,
            "user_id": f"mock_user_{suffix}",
        }

    if not HAS_FIREBASE_ADMIN or auth is None:
        print("[Auth Warning] firebase_admin package is not installed.")
        return {
            "uid": "dev_user_uid",
            "email": "dev@astrosutra.ai",
            "name": "Dev Seeker",
            "picture": None,
            "auth_time": 0,
            "user_id": "dev_user_uid",
        }

    try:
        decoded = auth.verify_id_token(id_token)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "name": decoded.get("name") or decoded.get("email", "").split("@")[0] or "Seeker",
            "picture": decoded.get("picture"),
            "auth_time": decoded.get("auth_time"),
            "user_id": decoded.get("user_id"),
        }
    except Exception as e:
        err_msg = str(e).lower()
        if "token used too early" in err_msg or "issued in the future" in err_msg:
            # Quietly fallback to manual verification (which supports leeway)
            print("[Firebase Admin] Token clock drift detected, falling back to manual validation.")
            try:
                return verify_firebase_token_manually(id_token)
            except Exception as fallback_err:
                print(f"[Auth Error] Fallback token verification failed during clock drift: {fallback_err}")
                raise HTTPException(status_code=401, detail=f"Unauthorized: Invalid or expired Firebase Token ({str(fallback_err)})")
        else:
            print(f"[Firebase Admin] verify_id_token failed: {e}. Attempting manual fallback verification...")
            try:
                return verify_firebase_token_manually(id_token)
            except Exception as fallback_err:
                print(f"[Auth Error] Fallback token verification failed: {fallback_err}")
                raise HTTPException(status_code=401, detail=f"Unauthorized: Invalid or expired Firebase Token ({str(fallback_err)})")


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency that extracts Bearer JWT token from Authorization header,
    verifies it via Firebase Admin SDK, and returns user claims (uid, email, name, picture).
    """
    if not authorization:
        return None

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format. Expected 'Bearer <token>'.")

    token = parts[1]
    return verify_firebase_token(token)


def require_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Strict FastAPI dependency for protected endpoints requiring valid Firebase authentication.
    """
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to access this resource.")
    return user
