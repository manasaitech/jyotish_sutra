import json
import os
import sys

# Add the workspace root and backend directories to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from backend.astrology.dosha_reasoning import compute_doshas

# Load a sample profile
profile_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "profiles", "prof_1784703977232_scavt.json"))
with open(profile_path, "r", encoding="utf-8") as f:
    profile_data = json.load(f)

# Extract natal chart details
natal_chart = profile_data.get("natal", {}).get("natal", {})
if not natal_chart:
    natal_chart = profile_data.get("natal_chart", {}).get("natal", {})

if not natal_chart:
    print("Could not find chart_data in profile!")
    sys.exit(1)

# Run calculations
res = compute_doshas(natal_chart)
print("DOSHA RESPONSE:")
print(json.dumps(res, indent=2))
