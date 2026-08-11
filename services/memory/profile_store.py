"""
Database-backed profile store using SQLAlchemy.

Saves birth details and calculated natal charts directly to the PostgreSQL database
instead of storing JSON files on disk. Survives server restarts and integrates
seamlessly with our multi-schema database architecture.
"""

import os
import uuid
import sys
from datetime import datetime, time, date

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from db import SessionLocal
from db.models.identity import User
from db.models.astrology import AstroProfile, AstroBirthDetails, AstroChart


def get_valid_uuid(user_id: str) -> uuid.UUID:
    """Safely cast any input string into a deterministic UUID."""
    try:
        return uuid.UUID(user_id)
    except ValueError:
        # Generate deterministic UUID based on namespace to support arbitrary session IDs
        return uuid.uuid5(uuid.NAMESPACE_DNS, user_id)


def resolve_db_user(db, user_id: str) -> User | None:
    """
    Looks up a database User record by:
    1. firebase_uid (if user_id matches a Firebase UID)
    2. id (using get_valid_uuid(user_id))
    """
    if not user_id:
        return None
    # 1. Search by firebase_uid
    user = db.query(User).filter(User.firebase_uid == user_id).first()
    if user:
        return user
    # 2. Fallback to parsing as UUID
    try:
        db_user_id = get_valid_uuid(user_id)
        return db.query(User).filter(User.id == db_user_id).first()
    except Exception:
        return None


class ProfileStore:
    """SQLAlchemy-based persistent storage for user astrology profiles."""

    def has_profile(self, user_id: str) -> bool:
        """Check whether a profile exists for the given user ID."""
        db = SessionLocal()
        try:
            user = resolve_db_user(db, user_id)
            if not user:
                return False
            profile = db.query(AstroProfile).filter(AstroProfile.user_id == user.id).first()
            return profile is not None
        except Exception as e:
            print(f"[ProfileStore] Error in has_profile: {e}")
            return False
        finally:
            db.close()

    def save_profile(
        self,
        user_id: str,
        birth_details: dict,
        natal_chart: dict,
        chart_response: dict,
        owner_id: str | None = None,
    ):
        """
        Persist a user profile to the database.

        Parameters
        ----------
        user_id : str
            The anonymous UUID from client localStorage or verified Firebase uid.
        birth_details : dict
            Raw birth inputs: name, date_of_birth, time_of_birth, latitude, longitude, timezone_offset.
        natal_chart : dict
            The full calculated natal chart context (planets, houses, yogas, doshas).
        chart_response : dict
            The summary response sent back to the frontend.
        owner_id : str, optional
            The authenticated primary user's UID to link the profile to.
        """
        db = SessionLocal()
        try:
            profile_uuid = get_valid_uuid(user_id)

            # 1. Resolve owner User
            owner = None
            if owner_id:
                owner = resolve_db_user(db, owner_id)
            if not owner:
                owner = resolve_db_user(db, user_id)

            if not owner:
                # Create new anonymous guest user
                db_user_id = get_valid_uuid(user_id)
                owner = User(
                    id=db_user_id,
                    email=f"anonymous_{user_id}@jyotishasutra.ai",
                    display_name=birth_details.get("name", "Astro User"),
                    status="active",
                    email_verified=False
                )
                db.add(owner)
                db.commit()
            
            db_user_id = owner.id

            # 2. Find or create AstroProfile
            profile = db.query(AstroProfile).filter(AstroProfile.id == profile_uuid).first()
            if not profile:
                profile = db.query(AstroProfile).filter(AstroProfile.user_id == profile_uuid).first()

            if not profile:
                profile = AstroProfile(
                    id=profile_uuid,
                    user_id=db_user_id,
                    name=birth_details.get("name", "Profile")
                )
                db.add(profile)
                db.commit()
            else:
                profile.name = birth_details.get("name", profile.name)
                db.commit()

            # 3. Parse date and time values safely
            dob_str = birth_details.get("date_of_birth")
            tob_str = birth_details.get("time_of_birth")
            
            dob = None
            if dob_str:
                try:
                    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                except ValueError:
                    pass
                    
            tob = None
            if tob_str:
                try:
                    parts = tob_str.split(":")
                    if len(parts) == 2:
                        tob = time(int(parts[0]), int(parts[1]))
                    elif len(parts) >= 3:
                        tob = time(int(parts[0]), int(parts[1]), int(parts[2].split(".")[0]))
                except ValueError:
                    pass

            # 4. Insert or update AstroBirthDetails
            details = db.query(AstroBirthDetails).filter(AstroBirthDetails.profile_id == profile.id).first()
            if not details:
                details = AstroBirthDetails(
                    profile_id=profile.id,
                    date_of_birth=dob,
                    time_of_birth=tob,
                    latitude=birth_details.get("latitude"),
                    longitude=birth_details.get("longitude"),
                    timezone_offset=birth_details.get("timezone_offset")
                )
                db.add(details)
            else:
                details.date_of_birth = dob or details.date_of_birth
                details.time_of_birth = tob or details.time_of_birth
                details.latitude = birth_details.get("latitude", details.latitude)
                details.longitude = birth_details.get("longitude", details.longitude)
                details.timezone_offset = birth_details.get("timezone_offset", details.timezone_offset)

            # 5. Insert or update AstroChart
            chart = db.query(AstroChart).filter(AstroChart.profile_id == profile.id, AstroChart.chart_type == "natal").first()
            
            existing_events = []
            if chart and chart.raw_data:
                existing_events = chart.raw_data.get("past_events", [])

            raw_payload = {
                "natal_chart": natal_chart,
                "chart_response": chart_response,
                "past_events": existing_events
            }

            if not chart:
                chart = AstroChart(
                    profile_id=profile.id,
                    chart_type="natal",
                    raw_data=raw_payload
                )
                db.add(chart)
            else:
                chart.raw_data = raw_payload

            db.commit()
            print(f"[ProfileStore] Saved database profile details successfully for {user_id}")
        except Exception as e:
            db.rollback()
            print(f"[ProfileStore] Failed to save profile to database: {e}")
            raise e
        finally:
            db.close()

    def load_profile(self, user_id: str) -> dict | None:
        """Load a profile from the database. Returns None if not found."""
        db = SessionLocal()
        try:
            profile_uuid = get_valid_uuid(user_id)
            profile = db.query(AstroProfile).filter(AstroProfile.id == profile_uuid).first()
            if not profile:
                profile = db.query(AstroProfile).filter(AstroProfile.user_id == profile_uuid).first()
            
            if not profile:
                return None

            details = db.query(AstroBirthDetails).filter(AstroBirthDetails.profile_id == profile.id).first()
            chart = db.query(AstroChart).filter(AstroChart.profile_id == profile.id, AstroChart.chart_type == "natal").first()

            if not details or not chart:
                return None

            # Reconstruct birth details
            birth_details = {
                "name": profile.name,
                "date_of_birth": details.date_of_birth.isoformat() if details.date_of_birth else None,
                "time_of_birth": details.time_of_birth.isoformat() if details.time_of_birth else None,
                "latitude": float(details.latitude) if details.latitude is not None else None,
                "longitude": float(details.longitude) if details.longitude is not None else None,
                "timezone_offset": float(details.timezone_offset) if details.timezone_offset is not None else None
            }

            payload = chart.raw_data or {}
            
            return {
                "user_id": user_id,
                "birth_details": birth_details,
                "natal_chart": payload.get("natal_chart"),
                "chart_response": payload.get("chart_response"),
                "past_events": payload.get("past_events", []),
                "created_at": chart.created_at.isoformat() if hasattr(chart, "created_at") and chart.created_at else datetime.now().isoformat(),
                "updated_at": chart.updated_at.isoformat() if hasattr(chart, "updated_at") and chart.updated_at else datetime.now().isoformat()
            }
        except Exception as e:
            print(f"[ProfileStore] Failed to load profile from database: {e}")
            return None
        finally:
            db.close()

    def delete_profile(self, user_id: str) -> bool:
        """Delete a profile from the database. Returns True if deleted, False if not found."""
        db_user_id = get_valid_uuid(user_id)
        db = SessionLocal()
        try:
            profile = db.query(AstroProfile).filter(AstroProfile.user_id == db_user_id).first()
            if not profile:
                return False
            
            db.delete(profile)
            db.commit()
            print(f"[ProfileStore] Deleted database profile for {user_id}")
            return True
        except Exception as e:
            db.rollback()
            print(f"[ProfileStore] Failed to delete profile: {e}")
            return False
        finally:
            db.close()

    def update_profile(self, user_id: str, **updates):
        """Partially update fields in an existing database profile."""
        db_user_id = get_valid_uuid(user_id)
        db = SessionLocal()
        try:
            profile = db.query(AstroProfile).filter(AstroProfile.user_id == db_user_id).first()
            if not profile:
                return False

            chart = db.query(AstroChart).filter(
                AstroChart.profile_id == profile.id,
                AstroChart.chart_type.in_(["natal", "birth"])
            ).first()
            if not chart:
                return False

            raw_data = chart.raw_data or {}
            
            if "natal_chart" in updates:
                raw_data["natal_chart"] = updates["natal_chart"]
            if "chart_response" in updates:
                raw_data["chart_response"] = updates["chart_response"]
            if "past_events" in updates:
                raw_data["past_events"] = updates["past_events"]
                
            chart.raw_data = raw_data
            db.commit()
            print(f"[ProfileStore] Updated profile snapshot in database for {user_id}")
            return True
        except Exception as e:
            db.rollback()
            print(f"[ProfileStore] Failed to update profile: {e}")
            return False
        finally:
            db.close()


# Global singleton instance
profile_store = ProfileStore()
