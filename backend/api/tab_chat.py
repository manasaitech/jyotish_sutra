"""
Tab-scoped Chat Endpoint.

Handles domain-specific chat by selecting the appropriate system prompt
and context builder based on the active tab.
"""
from fastapi import APIRouter, HTTPException, Depends
from models.request import TabChatRequest
from models.response import ChatResponse
from services.memory.session import session_store
from services.memory.profile_store import profile_store
from services.astrology.chart_resolver import resolve_chart_data
from services.rag.bg_16 import BG16Pipeline
from services.prompts.tabs import get_tab_system_prompt, build_tab_context
from services.llm.factory import LLMFactory
from core.auth import require_current_user
from db import SessionLocal
from db.models.identity import User

router = APIRouter()

# RAG pipeline (reused for spiritual tab)
rag_pipeline = BG16Pipeline()


@router.post("/tab-chat", response_model=ChatResponse)
def handle_tab_chat(req: TabChatRequest, current_user: dict = Depends(require_current_user)):
    try:
        firebase_uid = current_user.get("uid")
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not synchronized")
            if not req.user_id:
                req.user_id = str(db_user.id)
        finally:
            db.close()

        chart_data, birth_details = resolve_chart_data(
            session_id=req.session_id,
            user_id=req.user_id,
            req_birth_details=req.birth_details,
            req_chart_data=req.chart_data,
        )

        print(f"[TabChat] Incoming request: tab={req.tab}, is_initial={req.is_initial}, message={req.message}")
        session = session_store.get_session(req.session_id)
        from services.memory.chat_store import chat_store
        history = chat_store.get_history(req.session_id)

        if not chart_data:
            return {
                "response": "🙏 Please provide your birth details first so I can generate your chart.",
                "session_count": 0,
            }

        profile = birth_details or session.get("profile")
        mode = chart_data.get("mode", "exact")

        computed = session.get("computed_analyses") or chart_data.get("computed")
        if not computed and mode == "exact":
            from services.astrology.prakriti import estimate_prakriti
            from services.astrology.elements import calculate_element_distribution
            from services.astrology.lucky import calculate_lucky_attributes
            from services.astrology.planet_ranking import rank_planets
            from services.astrology.remedies_calc import generate_remedy_data

            prakriti = estimate_prakriti(chart_data)
            elements = calculate_element_distribution(chart_data)
            lucky = calculate_lucky_attributes(chart_data)
            rankings = rank_planets(chart_data)
            remedies = generate_remedy_data(chart_data, rankings)
            computed = {
                "prakriti": prakriti,
                "elements": elements,
                "lucky": lucky,
                "planet_rankings": rankings,
                "remedy_data": remedies,
            }
            session["computed_analyses"] = computed

        # Determine if this is the initial tab overview reading or a follow-up user chat question
        is_initial = bool(
            req.is_initial
            or req.message.startswith("Provide a detailed")
            or len(history) == 0
        )

        # Check if the exact user prompt was already asked in this session to prevent duplicate LLM calls
        if len(history) > 0:
            for idx, msg in enumerate(history):
                if msg.get("role") == "user" and msg.get("content", "").strip() == req.message.strip():
                    # Look at next assistant message
                    if idx + 1 < len(history) and history[idx + 1].get("role") == "assistant":
                        cached_msg = history[idx + 1]
                        cached_struct = cached_msg.get("metadata", {}).get("structured")
                        print(f"[TabChat] Returning cached response for prompt='{req.message}' from history.")
                        return {
                            "response": cached_msg.get("content"),
                            "structured": cached_struct,
                            "session_count": len(history),
                        }

        # ── Structured JSON Pipeline (enterprise mode) ──
        # For structured-enabled tabs on initial reads, attempt the structured analysis pipeline.
        # If it succeeds, we return structured JSON alongside a fallback markdown summary.
        # If it fails, we fall through to the existing markdown prose pipeline.
        from services.prompts.structured_schema import is_structured_enabled

        structured_result = None
        if is_initial and is_structured_enabled(req.tab) and mode == "exact":
            try:
                from services.prompts.structured_analysis import run_structured_analysis
                structured_result = run_structured_analysis(
                    chart_data=chart_data,
                    profile=profile,
                    computed=computed,
                    section_ids=[req.tab],
                    history=history,
                )
            except Exception as struct_err:
                print(f"[TabChat] Structured pipeline failed, falling back to markdown: {struct_err}")
                structured_result = None

            if structured_result is not None:
                # Build a fallback markdown summary from the structured data for backward compatibility
                fallback_text = _structured_to_markdown_fallback(structured_result)

                from utils.trust_note import append_trust_note
                fallback_text = append_trust_note(fallback_text)

                # Save chat turn to session history
                chat_store.add_message(req.session_id, req.user_id, "user", req.message)
                chat_store.add_message(req.session_id, req.user_id, "assistant", fallback_text, metadata={"structured": structured_result})

                return {
                    "response": fallback_text,
                    "structured": structured_result,
                    "session_count": len(chat_store.get_history(req.session_id)),
                }

        # ── Standard Markdown Prose Pipeline (existing behavior) ──
        # Use Prashna/Partial initial prompt ONLY for overview tab initial reading
        if mode == "prashna" and req.tab == "overview" and is_initial:
            from services.prompts.prashna import get_prashna_prompt
            from services.astrology.prashna_engine import format_prashna_context
            system_prompt = get_prashna_prompt("prashna")
            user_prompt = format_prashna_context(chart_data, profile)
        elif mode == "partial" and req.tab == "overview" and is_initial:
            from services.prompts.prashna import get_prashna_prompt
            from services.astrology.partial_horoscope_engine import format_partial_horoscope_context
            system_prompt = get_prashna_prompt("partial")
            user_prompt = format_partial_horoscope_context(chart_data, profile)
        else:
            # Get domain-specific system prompt
            system_prompt = get_tab_system_prompt(req.tab, is_initial=is_initial, sub_tab=req.sub_tab)

            # Build domain-specific user context
            passages = None
            if req.tab == "spiritual":
                passages = rag_pipeline.search_wisdom(req.message, top_k=2)

            user_prompt = build_tab_context(
                tab=req.tab,
                query=req.message,
                chart_data=chart_data,
                profile=profile,
                session=session,
                history=history,
                computed=computed,
                passages=passages,
                relationship_type=req.relationship_type,
                sub_tab=req.sub_tab,
            )

        # Invoke LLM
        client = LLMFactory.get_client()
        api_key = session.get("key")
        if api_key:
            client.api_key = api_key

        from utils.trust_note import append_trust_note

        target_tokens = 4000
        response_text = client.generate(system_prompt, user_prompt, max_tokens=target_tokens)
        response_text = append_trust_note(response_text)

        # Save chat turn to session history
        chat_store.add_message(req.session_id, req.user_id, "user", req.message)
        chat_store.add_message(req.session_id, req.user_id, "assistant", response_text)

        return {
            "response": response_text,
            "session_count": len(chat_store.get_history(req.session_id)),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _structured_to_markdown_fallback(structured: dict) -> str:
    """
    Convert a structured report JSON into a simple markdown summary string.
    Used as the `response` field for backward compatibility with older frontend versions.
    """
    try:
        report = structured.get("report", {})
        parts = []

        # Check if this is the doshas tab (has 'ongoing', 'completed', or 'upcoming')
        if "ongoing" in report or "completed" in report or "upcoming" in report:
            summary = report.get("summary", {})
            parts.append(f"### 🛡️ Vedic Doshas Timeline Summary")
            parts.append(
                f"**Total Detected:** {summary.get('total_detected', 0)}\n"
                f"**Ongoing (Active):** {summary.get('ongoing', 0)}\n"
                f"**Completed (Past):** {summary.get('completed', 0)}\n"
                f"**Upcoming (Future):** {summary.get('upcoming', 0)}"
            )
            
            def format_group(title, list_items):
                if not list_items:
                    return
                parts.append(f"\n### {title}")
                for d in list_items:
                    stars = "★" * d.get("formation_strength", 1) + "☆" * (5 - d.get("formation_strength", 1))
                    name = d.get("name") or "Dosha"
                    
                    if title == "Ongoing":
                        period_str = f"Started: {d.get('started', '')} | Ends: {d.get('expected_end', '')}"
                    elif title == "Upcoming":
                        period_str = f"Expected: {d.get('expected_start', '')}–{d.get('expected_end', '')}"
                    else:
                        period_str = f"Active Period: {d.get('active_period', '')}"
                        
                    parts.append(f"#### ⚠️ {name} ({stars} - {period_str})")
                    parts.append(f"**Activation Reason:** {d.get('activation_reason')}")
                    
                    logic = d.get("why_exists") or []
                    parts.append(f"**Formation logic:** {', '.join(logic)}")
                    
                    mitigation = d.get("protective_factors") or []
                    if mitigation:
                        parts.append(f"**Mitigating Factors:** {', '.join(mitigation)}")
                        
                    parts.append(f"**Practical Impact:** {d.get('practical_impact', 'Minimal')}")
                    
                    remedies = d.get("remedies") or {}
                    if remedies:
                        parts.append("**Recommended Remedies:**")
                        if remedies.get("spiritual"):
                            parts.append(f"- *Spiritual:* {', '.join(remedies.get('spiritual'))}")
                        if remedies.get("lifestyle"):
                            parts.append(f"- *Lifestyle:* {', '.join(remedies.get('lifestyle'))}")
                        if remedies.get("practical"):
                            parts.append(f"- *Practical:* {', '.join(remedies.get('practical'))}")

            format_group("Ongoing", report.get("ongoing", []))
            format_group("Upcoming", report.get("upcoming", []))
            format_group("Completed", report.get("completed", []))
            
            disclaimer = report.get("disclaimer", "")
            if disclaimer:
                parts.append(f"\n*{disclaimer}*")
            return "\n\n".join(parts)

        # Executive summary
        summary = report.get("executiveSummary", "")
        if summary:
            parts.append(summary)

        # Section summaries
        for section in report.get("sections", []):
            title = section.get("title", "")
            sec_summary = section.get("summary", "")
            if title and sec_summary:
                parts.append(f"**{title}**: {sec_summary}")

            # Key observations
            observations = section.get("keyObservations", [])
            if observations:
                for obs in observations:
                    if isinstance(obs, str) and obs.strip():
                        parts.append(f"• {obs}")

        # Overall recommendations
        recs = report.get("overallRecommendations", [])
        if recs:
            parts.append("\n**Recommendations:**")
            for rec in recs:
                if isinstance(rec, str) and rec.strip():
                    parts.append(f"• {rec}")

        # Disclaimer
        disclaimer = report.get("disclaimer", "")
        if disclaimer:
            parts.append(f"\n*{disclaimer}*")

        return "\n\n".join(parts) if parts else "Analysis complete. Please view the structured report."
    except Exception:
        return "Structured analysis complete."

