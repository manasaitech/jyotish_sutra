from fastapi import APIRouter, HTTPException, Depends
from models.request import ChatRequest
from models.response import ChatResponse
from services.memory.session import session_store
from services.memory.profile_store import profile_store
from services.memory.history import ChatHistory
from services.astrology.chart_resolver import resolve_chart_data
from services.rag.bg_16 import BG16Pipeline
from services.prompts.system import get_system_prompt
from services.prompts.horoscope import build_horoscope_prompt
from services.prompts.geeta import build_geeta_prompt, assemble_unified_prompt, classify_intent
from services.prompts.financial import is_financial_query, get_financial_system_prompt
from services.llm.factory import LLMFactory
from core.auth import require_current_user
from db import SessionLocal
from db.models.identity import User

# New astrology engine imports
from backend.astrology.chart_storage import chart_cache
from backend.astrology.chart_selector import select_charts_for_topic

from services.memory.chat_store import chat_store

router = APIRouter()

# Instantiate global collection-specific RAG pipeline for Bhagavad Gita Chapter 16
rag_pipeline = BG16Pipeline()

@router.post("/chat", response_model=ChatResponse)
def handle_chat(req: ChatRequest, current_user: dict = Depends(require_current_user)):
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
        history = chat_store.get_history(req.session_id)

        # Check if the exact prompt was already asked in this session to prevent duplicate LLM calls
        if len(history) > 0:
            for idx, msg in enumerate(history):
                if msg.get("role") == "user" and msg.get("content", "").strip() == req.message.strip():
                    # Look at next assistant message
                    if idx + 1 < len(history) and history[idx + 1].get("role") == "assistant":
                        cached_msg = history[idx + 1]
                        print(f"[Chat] Returning cached response for prompt='{req.message}' from history.")
                        return {
                            "response": cached_msg.get("content"),
                            "session_count": len(history),
                        }

        # 1. Block if birth chart is not generated yet
        if not chart_data:
            return {
                "response": "🙏 Namaste. Before I can offer specific readings, please provide your birth details (date, time, and city) above so I may calculate your Lagna chart.",
                "session_count": len(history)
            }
            
        # 2. Classify user intent for topic-based chart selection
        detected_intent = classify_intent(req.message)
        
        # 3. Load the full chart bundle from cache (if available)
        cache_key = req.user_id or req.session_id
        chart_bundle = session.get("chart_bundle") or chart_cache.load(cache_key)
        
        # 4. Select topic-specific charts for the LLM
        selected_charts = None
        if chart_bundle:
            selected_charts = select_charts_for_topic(detected_intent, chart_bundle)
            
        # 5. Determine prompt style based on context and history
        if not (len(history) == 0) and is_financial_query(req.message):
            system_prompt = get_financial_system_prompt()
        else:
            system_prompt = get_system_prompt()
        
        # Retrieve relevant Bhagavad Gita verses using RAG
        gita_passages = rag_pipeline.search_wisdom(req.message, top_k=2)
        
        profile = birth_details or session.get("profile")
        
        # Is this the initial analysis request?
        is_initial = len(history) == 0
        
        if is_initial:
            user_prompt = build_horoscope_prompt(
                name=profile.get("name") if profile else "Seeker", 
                chart_data=chart_data,
                profile=profile
            )
        else:
            try:
                user_prompt = assemble_unified_prompt(
                    query=req.message,
                    chart_data=chart_data,
                    profile=profile,
                    history=history,
                    passages=gita_passages,
                    intent=detected_intent,
                    selected_charts=selected_charts,
                )
            except TypeError as e:
                if "unexpected keyword argument" in str(e) or "selected_charts" in str(e):
                    user_prompt = assemble_unified_prompt(
                        query=req.message,
                        chart_data=chart_data,
                        profile=profile,
                        history=history,
                        passages=gita_passages,
                        intent=detected_intent,
                    )
                else:
                    raise e
            
        # 6. Invoke LLM
        api_key = session.get("key")
        
        client = LLMFactory.get_client()
        if api_key:
            client.api_key = api_key
            
        from utils.trust_note import append_trust_note

        response_text = client.generate(system_prompt, user_prompt, max_tokens=4000)
        response_text = append_trust_note(response_text)
        
        # Log to AI Analytics
        log_ai_request_to_db(req.user_id, req.session_id, user_prompt, response_text)
        
        # 7. Save chat turn to session history
        chat_store.add_message(req.session_id, req.user_id, "user", req.message)
        chat_store.add_message(req.session_id, req.user_id, "assistant", response_text)
        
        return {
            "response": response_text,
            "session_count": len(chat_store.get_history(req.session_id))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def log_ai_request_to_db(user_id_str: str, session_id_str: str, prompt: str, response: str):
    """Asynchronously logs LLM prompt and completion token statistics to the database."""
    try:
        import uuid
        from db import SessionLocal
        from db.models.analytics import AIAnalytics
        
        db = SessionLocal()
        try:
            p_tokens = len(prompt) // 4
            c_tokens = len(response) // 4
            user_uuid = uuid.UUID(user_id_str) if user_id_str else None
            session_uuid = uuid.UUID(session_id_str) if session_id_str else None
            
            log_entry = AIAnalytics(
                user_id=user_uuid,
                session_id=session_uuid,
                prompt_text=prompt[:1000],
                response_text=response[:1000],
                model_used="hybrid",
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                total_tokens=p_tokens + c_tokens
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"[Analytics] Failed to log AI request: {e}")

