import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("backend/api/tab_chat.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = re.findall(r".*dosha.*", code, re.IGNORECASE)
for m in matches:
    print(m)
