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

        target_tokens = 750 if is_initial else 420
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
