import json
from datetime import datetime
import redis.asyncio as aioredis

CONTEXT_TTL = 3600

async def get_context(redis: aioredis.Redis, conversation_id: str, user_id: str) -> list:
    key = f"conv:{user_id}:{conversation_id}"
    data = await redis.get(key)
    return json.loads(data) if data else []

async def save_turn(redis: aioredis.Redis, conversation_id: str, user_id: str,
                    user_message: str, assistant_response: str, intent) -> None:
    key = f"conv:{user_id}:{conversation_id}"
    context = await get_context(redis, conversation_id, user_id)
    context.append({"role": "user", "content": user_message, "timestamp": datetime.utcnow().isoformat(),
                     "vertical": intent.verticals[0] if intent.verticals else None})
    context.append({"role": "assistant", "content": assistant_response, "timestamp": datetime.utcnow().isoformat()})
    if len(context) > 20:
        context = context[-20:]
    await redis.setex(key, CONTEXT_TTL, json.dumps(context))
