import os
from services.llm.claude import AnthropicClient
from services.llm.groq import GroqClient

class HybridClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.claude_client = AnthropicClient(api_key=api_key)
        self.groq_client = GroqClient(api_key=api_key)

    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 4000, **kwargs) -> str:
        # First request should always come to Claude API
        claude_key = self.api_key or os.environ.get("Claude_API") or os.environ.get("ANTHROPIC_API_KEY")
        if claude_key:
            try:
                self.claude_client.api_key = claude_key
                from anthropic import Anthropic
                self.claude_client.client = Anthropic(api_key=claude_key)

                # Try Claude Sonnet 4.5/3.5 fallback via the AnthropicClient with raise_on_error=True
                print("[HybridClient] Attempting Claude request...")
                res = self.claude_client.generate(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    max_tokens=max_tokens if max_tokens else 4000,
                    raise_on_error=True
                )
                return res
            except Exception as e:
                print(f"[HybridClient] Claude API request failed completely: {e}. Falling back to Groq API keys...")
        else:
            print("[HybridClient] No Claude API key configured. Skipping Claude...")

        # If Claude failed or key is missing, fall back to Groq
        if self.api_key:
            self.groq_client.api_key = self.api_key
        return self.groq_client.generate(system_prompt, user_prompt, max_tokens=max_tokens, **kwargs)


class LLMFactory:
    @staticmethod
    def get_client(provider: str = None):
        """Factory method to resolve the active LLM provider (defaulting to environment variables)."""
        if not provider:
            provider = os.environ.get("LLM_PROVIDER", "groq")
            
        provider = provider.lower()
        
        if provider in ["claude", "anthropic", "anthropic_claude"]:
            return AnthropicClient()
        elif provider == "groq":
            return HybridClient()
        else:
            return HybridClient()
            
def generate_response(system_prompt: str, user_prompt: str, provider: str = None) -> str:
    client = LLMFactory.get_client(provider)
    return client.generate(system_prompt, user_prompt)
