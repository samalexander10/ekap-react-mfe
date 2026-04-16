from pydantic import BaseModel
from typing import Optional

class IntentClassification(BaseModel):
    verticals: list[str]
    sub_verticals: list[str] = []
    sensitivity_level: str = "NORMAL"
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    is_status_check: bool = False
    status_check_type: Optional[str] = None

class VerticalResponse(BaseModel):
    vertical_id: str
    retrieved_chunks: list[str] = []
    system_prompt: str = ""
    sensitivity_level: str = "NORMAL"
    escalation_recommended: bool = False
    source_citations: list[str] = []
    action_suggestions: list[dict] = []
