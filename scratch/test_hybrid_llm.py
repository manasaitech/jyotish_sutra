import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from services.llm.factory import LLMFactory

def test_hybrid_client():
    print("====================================================")
    print("Testing Hybrid LLM Client")
    print("====================================================")
    
    # Check loaded keys
    print(f"Claude_API is set: {bool(os.environ.get('Claude_API'))}")
    print(f"GROQ_API_KEY_FALLBACK is set: {bool(os.environ.get('GROQ_API_KEY_FALLBACK'))}")
    
    client = LLMFactory.get_client()
    print(f"Resolved client class: {client.__class__.__name__}")
    
    # 1. Test standard call (should attempt Claude first)
    print("\n--- Test Case 1: Standard LLM Call ---")
    try:
        response = client.generate(
            system_prompt="You are a helpful Vedic astrologer assistant. Keep responses under 50 words.",
            user_prompt="Explain the significance of the Moon in the 1st House."
        )
        print("Success! Response received:")
        print(response)
    except Exception as e:
        print(f"Error during standard call: {e}")

    # 2. Test fallback call (simulate Claude API failure by overriding Claude_API with a bad key)
    print("\n--- Test Case 2: Simulating Claude Failure / Fallback to Groq ---")
    original_claude_api = os.environ.get("Claude_API")
    # Temporarily set to invalid key to force exception
    os.environ["Claude_API"] = "sk-ant-api03-invalidkey1234567890abcdefghijklmnopqrstuvwxyz"
    try:
        # Re-initialize or re-load the client to ensure it picks up the overridden key
        fallback_client = LLMFactory.get_client()
        response = fallback_client.generate(
            system_prompt="You are a helpful Vedic astrologer assistant. Keep responses under 50 words.",
            user_prompt="Explain the significance of Sun in the 1st House."
        )
        print("Success! Fallback response received:")
        print(response)
    except Exception as e:
        print(f"Error during fallback call: {e}")
    finally:
        # Restore key
        if original_claude_api:
            os.environ["Claude_API"] = original_claude_api
        else:
            del os.environ["Claude_API"]

if __name__ == "__main__":
    test_hybrid_client()
