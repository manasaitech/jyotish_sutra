"""
Database-backed Chat Store using SQLAlchemy.

Persists chat sessions and messages directly to PostgreSQL (ai schema)
to survive server restarts and sync history across devices.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any

from db import SessionLocal
from db.models.identity import User
from db.models.ai_chat import ChatSession, ChatMessage
from services.memory.profile_store import get_valid_uuid, resolve_db_user


class ChatStore:
    """Manages persistent chat session and message storage in PostgreSQL."""

    def get_or_create_session(self, session_id: str, user_id: str | None, tab_context: str | None = None) -> uuid.UUID:
        """Find or create a database ChatSession, ensuring the parent User exists."""
        if not user_id:
            raise ValueError("Authentication required: user_id is missing")

        db_session_id = get_valid_uuid(session_id)

        db = SessionLocal()
        try:
            # 1. Ensure User exists in platform.users (needed for Foreign Key constraint)
            user = resolve_db_user(db, user_id)
            if not user:
                raise ValueError("User not synchronized in database")

            # 2. Check if ChatSession exists
            session = db.query(ChatSession).filter(ChatSession.id == db_session_id).first()
            if not session:
                session = ChatSession(
                    id=db_session_id,
                    user_id=user.id,
                    tab_context=tab_context[:50] if tab_context else "general",
                    status="active",
                    message_count=0
                )
                db.add(session)
                db.commit()
            return session.id
        except Exception as e:
            db.rollback()
            print(f"[ChatStore] Failed to resolve chat session: {e}")
            raise e
        finally:
            db.close()

    def add_message(self, session_id: str, user_id: str | None, role: str, content: str, latency_ms: int | None = None, metadata: dict = None) -> None:
        """Save a new chat message to the database and increment message count."""
        db_session_id = self.get_or_create_session(session_id, user_id)
        db = SessionLocal()
        try:
            # 1. Insert message
            msg = ChatMessage(
                session_id=db_session_id,
                role=role,
                content=content,
                latency_ms=latency_ms,
                metadata_=metadata or {}
            )
            db.add(msg)

            # 2. Update message count on session
            session = db.query(ChatSession).filter(ChatSession.id == db_session_id).first()
            if session:
                session.message_count += 1

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[ChatStore] Failed to add message: {e}")
            raise e
        finally:
            db.close()

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Retrieve full conversation history for a given session."""
        db_session_id = get_valid_uuid(session_id)
        db = SessionLocal()
        try:
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == db_session_id)
                .order_by(ChatMessage.created_at.asc())
                .all()
            )
            history = []
            for msg in messages:
                history.append({
                    "role": msg.role,
                    "content": msg.content,
                    "metadata": msg.metadata_ or {},
                    "created_at": msg.created_at.isoformat() if msg.created_at else datetime.utcnow().isoformat()
                })
            return history
        except Exception as e:
            print(f"[ChatStore] Failed to retrieve history: {e}")
            return []
        finally:
            db.close()


chat_store = ChatStore()
