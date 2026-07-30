import os
import sys
import json

# Add the workspace root and backend directories to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from backend.api.doshas import get_dosha_timeline, DoshaTimelineRequest

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

req = DoshaTimelineRequest(
    session_id="test_session",
    user_id="test_user",
    chart_data=natal_chart,
    birth_details=profile_data.get("birth_details")
)

try:
    res = get_dosha_timeline(req, authorization=None)
    print("API RESPONSE FOR DOSHA TIMELINE DIRECT ROUTE:")
    print(json.dumps(res, indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
