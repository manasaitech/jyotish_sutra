import json
import os

profile_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "profiles", "prof_1784703977232_scavt.json"))
with open(profile_path, "r", encoding="utf-8") as f:
    p = json.load(f)

# Search recursively for "sade_sati" key
def find_key(d, key, path=""):
    if isinstance(d, dict):
        for k, v in d.items():
            new_path = f"{path}.{k}" if path else k
            if k == key:
                print(f"Found '{key}' at path: {new_path}")
                print(json.dumps(v, indent=2))
            find_key(v, key, new_path)
    elif isinstance(d, list):
        for idx, item in enumerate(d):
            find_key(item, key, f"{path}[{idx}]")

find_key(p, "sade_sati")
