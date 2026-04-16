import re

NAME_CHANGE_PATTERNS = [
    r"name change",
    r"change.*name",
    r"update.*name",
    r"legal name",
    r"got married",
    r"marriage",
    r"divorce",
    r"new last name",
    r"new name",
]

def detect_intent(message: str) -> str | None:
    """Detect user intent from message text."""
    lower = message.lower()
    for pattern in NAME_CHANGE_PATTERNS:
        if re.search(pattern, lower):
            return "name_change"
    return None
