import anthropic
from typing import AsyncIterator
from ..models.routing import IntentClassification, VerticalResponse
from ..config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

SENSITIVITY_TONES = {
    "HIGH_SENSITIVITY": "You are a compassionate HR assistant. This is a highly sensitive topic. Be empathetic, non-judgmental, and always include support resources.",
    "SENSITIVE": "You are a professional HR assistant. Handle this with discretion and respect for privacy.",
    "NORMAL": "You are a helpful, knowledgeable HR assistant. Provide clear, accurate answers based on company policy.",
}

async def synthesize_stream(query: str, vertical_responses: list[VerticalResponse],
                             intent: IntentClassification, context: list) -> AsyncIterator[str]:
    system_prompt = (vertical_responses[0].system_prompt if vertical_responses and vertical_responses[0].system_prompt
                     else SENSITIVITY_TONES.get(intent.sensitivity_level, SENSITIVITY_TONES["NORMAL"]))
    context_parts = [f"## {vr.vertical_id} Policy:\n" + "\n\n".join(vr.retrieved_chunks)
                     for vr in vertical_responses if vr.retrieved_chunks]
    policy_context = "\n\n".join(context_parts) or "No specific policy found. Use general HR best practices."
    history = [{"role": t["role"], "content": t["content"]} for t in context[-4:]]
    history.append({"role": "user", "content": f"Policy Context:\n{policy_context}\n\nQuestion: {query}"})
    async with client.messages.stream(model=settings.model, max_tokens=2048,
                                       system=system_prompt, messages=history) as stream:
        async for text in stream.text_stream:
            yield text
