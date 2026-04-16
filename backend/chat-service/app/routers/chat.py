import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import anthropic

from app.db import get_db
from app.config import settings
from app.schemas import ChatRequest
from app.models import ConversationTurn, AuditLog
from app.services.rag import retrieve_context
from app.services.intent import detect_intent

router = APIRouter()

SYSTEM_PROMPT = """You are EKAP, an Enterprise Knowledge & Action Platform assistant for HR.
You help employees with HR policies, benefits, and administrative tasks.

When employees ask about changing their name, respond with something like:
"I can help you start a legal name change request. Please use the Name Change form in the action panel."
Then emit an action card for name-change.

For policy questions, use the retrieved context to answer accurately.
Always be professional, empathetic, and concise.
"""

def make_action_event(action_type: str, label: str, payload: dict = {}) -> str:
    data = json.dumps({"type": "action", "action": {"type": action_type, "label": label, "payload": payload}})
    return f"data: {data}\n\n"

def make_text_event(text: str) -> str:
    data = json.dumps({"type": "text", "data": text})
    return f"data: {data}\n\n"

def make_done_event() -> str:
    return f"data: {json.dumps({'type': 'done'})}\n\n"

def make_error_event(msg: str) -> str:
    return f"data: {json.dumps({'type': 'error', 'data': msg})}\n\n"

async def stream_chat(request: ChatRequest, db: AsyncSession):
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    # Retrieve conversation history
    result = await db.execute(
        select(ConversationTurn)
        .where(ConversationTurn.conversation_id == request.conversation_id)
        .order_by(ConversationTurn.created_at)
        .limit(20)
    )
    history = result.scalars().all()

    # Retrieve RAG context
    context_docs = await retrieve_context(request.message)
    context_str = "\n\n".join(context_docs) if context_docs else ""

    # Build messages
    messages = [{"role": t.role, "content": t.content} for t in history]

    user_content = request.message
    if context_str:
        user_content = f"[Context from HR policies]\n{context_str}\n\n[Employee Question]\n{request.message}"

    messages.append({"role": "user", "content": user_content})

    # Detect intent for action cards
    intent = detect_intent(request.message)

    # Save user turn
    user_turn = ConversationTurn(
        conversation_id=request.conversation_id,
        user_id=request.user_id,
        role="user",
        content=request.message,
        vertical=request.vertical,
    )
    db.add(user_turn)

    # Audit log
    audit = AuditLog(
        event_type="chat_message",
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        query_text=request.message,
        vertical=request.vertical,
        sensitivity_level="low",
    )
    db.add(audit)
    await db.commit()

    full_response = ""

    try:
        async with client.messages.stream(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            async for text_chunk in stream.text_stream:
                full_response += text_chunk
                yield make_text_event(text_chunk)

        # Emit action card if intent detected
        if intent == "name_change":
            yield make_action_event("name-change", "Start Name Change Request")

        # Save assistant turn
        assistant_turn = ConversationTurn(
            conversation_id=request.conversation_id,
            user_id=request.user_id,
            role="assistant",
            content=full_response,
            vertical=request.vertical,
        )
        db.add(assistant_turn)
        await db.commit()

        yield make_done_event()

    except Exception as e:
        yield make_error_event(str(e))

@router.post("/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    return StreamingResponse(
        stream_chat(request, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConversationTurn)
        .where(ConversationTurn.conversation_id == conversation_id)
        .order_by(ConversationTurn.created_at)
    )
    turns = result.scalars().all()
    return [{"role": t.role, "content": t.content, "created_at": t.created_at} for t in turns]
