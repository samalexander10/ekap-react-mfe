from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str

class ChatRequest(BaseModel):
    conversation_id: str
    user_id: str = "user-001"
    message: str
    vertical: Optional[str] = None

class ActionCard(BaseModel):
    type: str
    label: str
    payload: dict = {}

class StreamEvent(BaseModel):
    type: str  # "text" | "action" | "done" | "error"
    data: str = ""
    action: Optional[ActionCard] = None
