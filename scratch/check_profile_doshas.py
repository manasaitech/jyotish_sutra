import json
import os

profile_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "profiles", "prof_1784703977232_scavt.json"))
with open(profile_path, "r", encoding="utf-8") as f:
    p = json.load(f)

chart = p.get("natal", {}).get("natal", {}) or p.get("natal_chart", {}).get("natal", {})
print(json.dumps(chart.get("doshas"), indent=2))
