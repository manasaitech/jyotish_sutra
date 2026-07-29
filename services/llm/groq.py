import os
import requests
import threading

class GroqClient:
    _lock = threading.Lock()
    _rr_index = 0

   

    def __init__(self, api_key: str = None):
        self.api_key = api_key

    def _get_all_keys(self) -> list:
        raw_keys = []
        if self.api_key:
            raw_keys.append(self.api_key)

        # Gather keys from standard environment variables
        env_keys = [
            os.environ.get("GROQ_API_KEY"),
            os.environ.get("GROQ_API_KEY_FALLBACK"),
            os.environ.get("GROQ_API_KEY_FALLBACK2"),
            os.environ.get("GROQ_API_KEY_FALLBACK3"),
            os.environ.get("GROQ_API_KEY_FALLBACK4"),
            os.environ.get("GROQ_API_KEY_FALLBACK5"),
            os.environ.get("GROQ_API_KEY_FALLBACK6"),
            os.environ.get("GROQ_API_KEY_FALLBACK7"),
            os.environ.get("GROQ_API_KEY_FALLBACK8"),
            os.environ.get("GROQ_API_KEY_FALLBACK9"),
            os.environ.get("GROQ_API_KEY_FALLBACK10"),
        ]

        # Gather any dynamically configured GROQ_API_KEY_* env vars
        for env_name, env_val in os.environ.items():
            if env_name.startswith("GROQ_API_KEY") and env_val:
                raw_keys.append(env_val)

        for k in env_keys:
            if k:
                raw_keys.append(k)

        # Deduplicate while preserving insertion order
        unique_keys = []
        for k in raw_keys:
            if k and k not in unique_keys:
                unique_keys.append(k)
        return unique_keys

    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 700) -> str:
        """Call Groq API using thread-safe round-robin across all available API keys with model fallback."""
        keys = self._get_all_keys()
        if not keys:
            return f"Cosmic connection failed: No Groq API keys available.\n\n{self._offline_fallback(user_prompt)}"

        # Get round-robin starting index atomically
        with GroqClient._lock:
            start_idx = GroqClient._rr_index % len(keys)
            GroqClient._rr_index += 1

        # Re-order keys starting from start_idx for full rotation & fallback
        ordered_keys = keys[start_idx:] + keys[:start_idx]

        last_error_message = "No API key configured."
        models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
        bad_keys = set()

        for model_name in models:
            for key in ordered_keys:
                if not key or key in bad_keys:
                    continue

                try:
                    url = "https://api.groq.com/openai/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json"
                    }
                    data = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": max_tokens
                    }

                    response = requests.post(url, headers=headers, json=data, timeout=30)
                    if response.ok:
                        res_data = response.json()
                        return res_data["choices"][0]["message"]["content"]
                    else:
                        last_error_message = f"Model {model_name} with Key ending ...{key[-6:]} HTTP {response.status_code}: {response.text}"
                        if response.status_code == 401:
                            bad_keys.add(key)
                except Exception as e:
                    last_error_message = f"Model {model_name} with Key ending ...{key[-6:]} Error: {str(e)}"
                    continue

        # If all keys and models fail
        return f"Cosmic connection failed: {last_error_message}\n\n{self._offline_fallback(user_prompt)}"

    def _offline_fallback(self, user_prompt: str) -> str:
        from services.llm.claude import AnthropicClient
        return AnthropicClient()._offline_vedic_interpretation(user_prompt)
