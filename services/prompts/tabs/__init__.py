"""
Tab Prompt Registry — Maps tab names to system prompts and context builders.
"""

from services.prompts.tabs.overview import get_overview_prompt, build_overview_context
from services.prompts.tabs.career import get_career_prompt, build_career_context
from services.prompts.tabs.marriage import get_marriage_prompt, build_marriage_context
from services.prompts.tabs.health import get_health_prompt, build_health_context
from services.prompts.tabs.food import get_food_prompt, build_food_context
from services.prompts.tabs.remedies import get_remedies_prompt, build_remedies_context
from services.prompts.tabs.finance import get_finance_prompt, build_finance_context
from services.prompts.tabs.personality import get_personality_prompt, build_personality_context
from services.prompts.tabs.spiritual import get_spiritual_prompt, build_spiritual_context
from services.prompts.tabs.dasha import get_dasha_prompt, build_dasha_context

TAB_REGISTRY = {
    "overview":       {"system": get_overview_prompt,    "context": build_overview_context},
    "career":         {"system": get_career_prompt,      "context": build_career_context},
    "dasha_timeline": {"system": get_dasha_prompt,       "context": build_dasha_context},
    "dasha":          {"system": get_dasha_prompt,       "context": build_dasha_context},
    "marriage":       {"system": get_marriage_prompt,     "context": build_marriage_context},
    "relationships":  {"system": get_marriage_prompt,     "context": build_marriage_context},
    "relationship":   {"system": get_marriage_prompt,     "context": build_marriage_context},
    "health":         {"system": get_health_prompt,       "context": build_health_context},
    "food":           {"system": get_food_prompt,         "context": build_food_context},
    "remedies":       {"system": get_remedies_prompt,     "context": build_remedies_context},
    "finance":        {"system": get_finance_prompt,      "context": build_finance_context},
    "personality":    {"system": get_personality_prompt,  "context": build_personality_context},
    "spiritual":      {"system": get_spiritual_prompt,    "context": build_spiritual_context},
}



SIMPLE_LANGUAGE_RULE = """
UNIVERSAL RULES (apply to ALL tabs):
- Paragraph 1 MUST directly answer the user's question by name with a specific timeline. Never start with "Based on precomputed details" or "As per the evidence brief."
- Explain astrological reasoning in simple everyday words that someone with ZERO astrology knowledge can understand. When mentioning planets, always explain what they represent (e.g. "Jupiter, the planet of growth and luck"). When mentioning houses, explain them simply (e.g. "the part of your chart that governs career").
- Speak as if you are personally reading their chart right now, not quoting a report.
"""


def get_tab_system_prompt(tab: str, is_initial: bool = True, sub_tab: str = "overview") -> str:
    """Return the system prompt for a given tab, switching between initial overview and chat mode."""
    entry = TAB_REGISTRY.get(tab, TAB_REGISTRY["overview"])
    if tab == "career":
        base = entry["system"](is_initial=is_initial, sub_tab=sub_tab)
    else:
        base = entry["system"](is_initial=is_initial)
    return base + SIMPLE_LANGUAGE_RULE




def build_tab_context(tab: str, **kwargs) -> str:
    """Build the domain-specific user prompt context for a given tab."""
    entry = TAB_REGISTRY.get(tab, TAB_REGISTRY["overview"])
    return entry["context"](**kwargs)
