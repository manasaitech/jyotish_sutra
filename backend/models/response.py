from pydantic import BaseModel
from typing import Dict, List, Any, Optional

class TimezoneResponse(BaseModel):
    timezone_name: str
    offset_hours: float

class ChartResponse(BaseModel):
    name: str
    ascendant_sign: Optional[str] = "Unknown"
    moon_sign: Optional[str] = "Unknown"
    nakshatra: Optional[str] = "Unknown"
    pada: Optional[int] = 1
    yogas: Optional[List[Dict[str, Any]]] = []
    doshas: Optional[Dict[str, Any]] = {}
    raw_positions: Optional[Dict[str, Any]] = {}
    
    # Extra fields for Prashna / Partial modes
    mode: Optional[str] = "exact"
    chart_type: Optional[str] = None
    question: Optional[str] = None
    category: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    prashna_time: Optional[str] = None
    prashna_lagna: Optional[Dict[str, Any]] = None
    panchanga: Optional[Dict[str, Any]] = None
    disclaimer: Optional[str] = None
    confidence_level: Optional[str] = None
    birth_date: Optional[str] = None
    time_slot: Optional[str] = None
    has_exact_time: Optional[bool] = None
    moon_stable: Optional[bool] = None
    exact_calculations: Optional[List[str]] = None
    estimated_calculations: Optional[List[str]] = None
    excluded_calculations: Optional[List[str]] = None
    transits: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    session_count: int
    structured: Optional[Dict[str, Any]] = None  # Structured JSON report (when available)

class ProfileResponse(BaseModel):
    """Response from the profile lookup endpoint."""
    exists: bool
    birth_details: Optional[Dict[str, Any]] = None
    chart_summary: Optional[Dict[str, Any]] = None
