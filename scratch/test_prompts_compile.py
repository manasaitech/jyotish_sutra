import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.prompts.tabs import get_tab_system_prompt, TAB_REGISTRY

def test_compile_prompts():
    print("Testing prompt compilation for all tabs...")
    for tab in TAB_REGISTRY:
        try:
            prompt_initial = get_tab_system_prompt(tab, is_initial=True)
            prompt_chat = get_tab_system_prompt(tab, is_initial=False)
            
            assert "FORMATTING & READABILITY" in prompt_initial
            assert "FORMATTING & READABILITY" in prompt_chat
            print(f"[OK] {tab} compiled successfully (initial length: {len(prompt_initial)}, chat length: {len(prompt_chat)})")
        except Exception as e:
            print(f"[ERROR] Failed to compile prompt for tab: {tab}. Error: {e}")
            sys.exit(1)
            
    print("All prompts compiled successfully!")

if __name__ == "__main__":
    test_compile_prompts()
