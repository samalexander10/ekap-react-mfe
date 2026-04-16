from sqlalchemy import text
from .connection import AsyncSessionLocal
from datetime import datetime

async def log_event(event_type: str, user_id: str, conversation_id: str = None,
                    query_text: str = None, vertical: str = None, sensitivity_level: str = None):
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(
                text("""INSERT INTO audit_logs (event_type, user_id, conversation_id, query_text, vertical, sensitivity_level, created_at)
                        VALUES (:event_type, :user_id, :conversation_id, :query_text, :vertical, :sensitivity_level, :created_at)"""),
                {"event_type": event_type, "user_id": user_id, "conversation_id": conversation_id,
                 "query_text": query_text, "vertical": vertical, "sensitivity_level": sensitivity_level,
                 "created_at": datetime.utcnow()}
            )
            await session.commit()
    except Exception:
        pass
