import os
import sys
from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(project_root, ".env"))

# Import admin main explicitly using importlib to prevent name conflicts with backend/main.py
import importlib.util
admin_main_path = os.path.join(project_root, "admin", "backend", "main.py")
spec = importlib.util.spec_from_file_location("admin_main", admin_main_path)
admin_main = importlib.util.module_from_spec(spec)
sys.modules["admin_main"] = admin_main
spec.loader.exec_module(admin_main)

app = admin_main.app

# Put the admin backend routes and auth in sys path so sub-imports inside auth work
sys.path.insert(0, os.path.join(project_root, "admin", "backend"))
sys.path.insert(0, os.path.join(project_root, "backend"))

from fastapi.testclient import TestClient
from auth import get_admin_user

# Mock dependency
def mock_get_admin_user():
    return {
        "uid": "mock-admin-uid",
        "email": "anmoldixit091@gmail.com",
        "name": "Mock Admin",
    }

# Apply dependency override
app.dependency_overrides[get_admin_user] = mock_get_admin_user

client = TestClient(app)

def run_tests():
    print("Testing Live Monitor endpoint...")
    
    # Test default minutes (60)
    print("\n--- Requesting: GET /api/admin/redeem-monitor (default minutes=60) ---")
    response = client.get("/api/admin/redeem-monitor")
    print("Status code:", response.status_code)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    print("Keys in response:", list(data.keys()))
    
    print("\nKPI Summary:")
    for k, v in data["kpis"].items():
        print(f"  {k}: {v}")
        
    print("\nTime Series Points count:", len(data["time_series"]))
    if data["time_series"]:
        print("  First point:", data["time_series"][0])
        print("  Last point:", data["time_series"][-1])
        
    print("\nCampaign Distribution:")
    for dist in data["campaign_distribution"]:
        print(f"  {dist['name']}: {dist['value']}")
        
    print("\nRequests per User (Top 5):")
    for r in data["requests_per_user"][:5]:
        print(f"  {r['email']} ({r['campaign_name']}): {r['requests_count']} requests, last at: {r['last_request_at']}")

    # Test custom minutes filter (10 mins)
    print("\n--- Requesting: GET /api/admin/redeem-monitor?minutes=10 ---")
    response_10 = client.get("/api/admin/redeem-monitor?minutes=10")
    print("Status code:", response_10.status_code)
    assert response_10.status_code == 200
    data_10 = response_10.json()
    print("Last 10 minutes requests count:", data_10["kpis"]["total_llm_requests"])
    print("Time Series Points count (10 mins):", len(data_10["time_series"]))

    print("\nTests completed successfully!")

if __name__ == "__main__":
    run_tests()
