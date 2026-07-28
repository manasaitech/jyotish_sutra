"""
Vedic Guidance & Karma Disclaimer Helper.

Appends a respectful, trust-inspiring note at the end of every AI response across all tabs.
"""

VEDIC_TRUST_NOTE = (
    "\n\n---\n"
    "> 🌌 **Vedic Guidance & Karma Note**: *These insights are derived from your unique birth chart (Janma Kundli) and planetary positions. "
    "In Vedic philosophy, planetary alignments reveal cosmic tendencies and potential energies, but your conscious actions (Karma), free will, "
    "and personal choices shape your actual life path. Use this guidance as a compass for self-awareness and conscious growth.*"
)


def append_trust_note(response_text: str) -> str:
    """
    Ensure the Vedic Guidance & Karma Note is attached to the response if not already present.
    """
    if not response_text or not isinstance(response_text, str):
        return response_text
    if "Vedic Guidance & Karma Note" in response_text or "Vedic Guidance Note" in response_text or "Karma Note" in response_text:
        return response_text
    return response_text.rstrip() + VEDIC_TRUST_NOTE
