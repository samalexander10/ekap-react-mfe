import anthropic
import json
from ..models.routing import IntentClassification
from ..config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """You are an intent classification system for an enterprise HR chat platform.
Verticals: HR (benefits, conduct, disciplinary, onboarding, remote-work), PAYROLL, FINANCE.
Sub-verticals: hr.conduct.sexual-harassment, hr.conduct.code-of-conduct, hr.benefits, hr.disciplinary, hr.remote-work, hr.onboarding.
Sensitivity: NORMAL, SENSITIVE, HIGH_SENSITIVITY (harassment/assault/discrimination = always HIGH_SENSITIVITY).
Respond ONLY with valid JSON:
{"verticals":["HR"],"sub_verticals":["hr.conduct.sexual-harassment"],"sensitivity_level":"HIGH_SENSITIVITY","needs_clarification":false,"clarification_question":null,"is_status_check":false,"status_check_type":null}"""

async def classify_intent(message: str, context: list, user_roles: list[str]) -> IntentClassification:
    messages = [{"role": t["role"], "content": t["content"]} for t in context[-4:]]
    messages.append({"role": "user", "content": f"Roles: {user_roles}\nQuery: {message}"})
    try:
        response = await client.messages.create(model=settings.model, max_tokens=512,
                                                 system=SYSTEM_PROMPT, messages=messages)
        return IntentClassification(**json.loads(response.content[0].text))
    except Exception:
        return IntentClassification(verticals=["HR"], sub_verticals=["hr.benefits"])
