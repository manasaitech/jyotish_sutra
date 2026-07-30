import os
import sys
import json
import unittest.mock as mock

# Add the workspace root and backend directories to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# Setup mocks
mock_db = mock.MagicMock()
mock_user_obj = mock.MagicMock()
mock_user_obj.id = 123
mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj

import backend.api.tab_chat
backend.api.tab_chat.SessionLocal = lambda: mock_db

from backend.api.tab_chat import handle_tab_chat
from backend.models.request import TabChatRequest

# Load a sample profile
profile_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "profiles", "prof_1784703977232_scavt.json"))
with open(profile_path, "r", encoding="utf-8") as f:
    profile_data = json.load(f)

# Extract natal chart details
natal_chart = profile_data.get("natal", {}).get("natal", {})
if not natal_chart:
    natal_chart = profile_data.get("natal_chart", {}).get("natal", {})

# Inject sade_sati into natal_chart's doshas for testing
natal_chart["doshas"] = {
    "sade_sati": {
        "is_present": True,
        "phase": "First Phase (12th from Moon)",
        "description": "Saturn is in the sign before your natal Moon."
    }
}

req = TabChatRequest(
    session_id="test_session",
    user_id="test_user",
    message="Provide a detailed doshas analysis for my horoscope.",
    tab="doshas",
    is_initial=True,
    chart_data=natal_chart,
    birth_details=profile_data.get("birth_details")
)

# Mock require_current_user
mock_user = {"uid": "u9Oawb1rqaWW2lO0T7E0SoZYMsD3"}

try:
    res = handle_tab_chat(req, current_user=mock_user)
    print("API RESPONSE FOR DOSHAS TAB:")
    print(json.dumps(res, indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
