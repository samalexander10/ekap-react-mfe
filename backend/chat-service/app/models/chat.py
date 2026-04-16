from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_roles: list[str] = ["EMPLOYEE"]

class ActionSuggestion(BaseModel):
    mini_app_id: str
    label: str

class ConversationTurn(BaseModel):
    role: str
    content: str
    vertical: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
