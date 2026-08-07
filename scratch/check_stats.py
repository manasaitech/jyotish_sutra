import os
import sys
from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(project_root, ".env"))

sys.path.insert(0, os.path.join(project_root, "admin", "backend"))

import db as admin_db
from sqlalchemy import text

session = admin_db.SessionLocal()
try:
    print("Latest chat messages:")
    query = """
        SELECT m.created_at, m.role, u.email
        FROM ai.chat_messages m
        JOIN ai.chat_sessions s ON m.session_id = s.id
        JOIN platform.users u ON s.user_id = u.id
        ORDER BY m.created_at DESC
        LIMIT 5
    """
    res = session.execute(text(query)).all()
    for row in res:
        print(f"  {row[0]} | {row[1]} | {row[2]}")
        
    print("\nRecent count by time windows (relative to now = 2026-08-07 07:40:00 UTC):")
    for mins in [10, 30, 60, 120, 300, 1440]:
        query_win = """
            SELECT COUNT(*) 
            FROM ai.chat_messages 
            WHERE role = 'user' AND created_at >= (NOW() - CAST(:mins AS INTEGER) * INTERVAL '1 minute')
        """
        # Note: NOW() is based on DB time. Let's check DB's NOW() vs our local time
        cnt = session.execute(text(query_win), {"mins": mins}).scalar()
        print(f"  Last {mins} mins: {cnt}")
        
    print("\nDB Server NOW():", session.execute(text("SELECT NOW()")).scalar())
except Exception as e:
    print("Error:", e)
finally:
    session.close()
