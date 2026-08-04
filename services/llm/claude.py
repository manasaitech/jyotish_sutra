import os

class AnthropicClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("Claude_API") or os.environ.get("ANTHROPIC_API_KEY")
        self.client = None
        
        if self.api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize Anthropic client: {e}")
                
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 4000, model: str = None, raise_on_error: bool = False, **kwargs) -> str:
        """Call Claude to generate response, with a smart offline Vedic fallback if API key is missing."""
        if not self.api_key or not self.client:
            if raise_on_error:
                raise ValueError("Claude API key or client is not initialized.")
            return self._offline_vedic_interpretation(user_prompt)
            
        model_name = model or os.environ.get("CLAUDE_MODEL") or "claude-sonnet-4-5-20250929"
        try:
            message = self.client.messages.create(
                model=model_name,
                max_tokens=max_tokens,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            return message.content[0].text
        except Exception as e:
            print(f"Anthropic generation error with model {model_name}: {e}")
            
            # If the primary model failed and it wasn't the 3.5 fallback, attempt the fallback
            if model_name != "claude-3-5-sonnet-20241022":
                try:
                    print("Attempting fallback to Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)...")
                    message = self.client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=max_tokens,
                        temperature=0.7,
                        system=system_prompt,
                        messages=[
                            {"role": "user", "content": user_prompt}
                        ]
                    )
                    return message.content[0].text
                except Exception as e35:
                    print(f"Anthropic fallback generation error with model claude-3-5-sonnet-20241022: {e35}")
                    if raise_on_error:
                        raise e35
            
            if raise_on_error:
                raise e
            return f"Blessings. The cosmos is currently clouded by connection issues: {str(e)} \n\n{self._offline_vedic_interpretation(user_prompt)}"
            
    def _offline_vedic_interpretation(self, user_prompt: str) -> str:
        """Offline smart fallback generator in case API key is missing or calls fail."""
        # Simple template-based interpretation based on keywords in prompt
        import re
        
        # Extract name
        name_match = re.search(r"Vedic Birth Chart \(Kundli\) of ([^\.\n]+)", user_prompt)
        name = name_match.group(1).strip() if name_match else "seeker"
        
        # Extract Ascendant
        asc_match = re.search(r"Sign: ([^\n]+)", user_prompt)
        asc = asc_match.group(1).strip() if asc_match else "Libra"
        
        # Extract Moon sign
        moon_match = re.search(r"Moon Sign \(Rashi\):? ([^\n]+)", user_prompt)
        moon = moon_match.group(1).strip() if moon_match else "Cancer"
        
        # Extract Nakshatra
        nak_match = re.search(r"Nakshatra:? ([^\n]+)", user_prompt)
        nak = nak_match.group(1).strip() if nak_match else "Pushya"
        
        return f"""🙏 Namaste {name}. Here is an authentic Vedic summary based on your astrological essence (Offline Mock Interpretation):

### 1. Lagna (Ascendant) & Life Path
Your Ascendant is **{asc}**. This governs your physical manifestation and life approach. Placed under this sign, you seek harmony, balance, and righteous actions (Dharma). You have a natural charm and value relationships, looking to create peace in your environment.

### 2. Key Planetary Alignments
- **Moon in {moon}**: Governs your emotional core and mind (Manas). This is a highly supportive position, indicating strong intuition, maternal connection, and deep emotional reserves.
- **Nakshatra is {nak}**: This Nakshatra is ruled by Saturn, bringing discipline and nourishment (represented by the cow's udder). You are a natural caretaker, seeking knowledge and spiritual development.

### 3. Yogas & Special Blessings
- **Gaja Kesari Yoga**: Promotes wisdom, material abundance, and success over life challenges. It points to a lifetime marked by respected leadership and continuous growth.

### 4. Remedial Guidance (Upayas)
- Observe mindfulness and feed birds on Saturdays to balance Saturn's influence.
- Meditate on Bhagavad Gita Chapter 2, Verse 47: "Thy right is to work only, but never to its fruits."
"""
