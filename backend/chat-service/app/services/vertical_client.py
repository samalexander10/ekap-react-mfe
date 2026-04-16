import httpx
from ..models.routing import VerticalResponse
from ..config import settings

VERTICAL_URLS = {"HR": settings.hr_service_url}

async def query_vertical(vertical: str, query: str, sub_verticals: list[str],
                          user_roles: list[str], user_id: str) -> VerticalResponse:
    base_url = VERTICAL_URLS.get(vertical)
    if not base_url:
        return VerticalResponse(vertical_id=vertical)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{base_url}/hr/query", json={
                "query": query, "subVerticals": sub_verticals,
                "userRoles": user_roles, "userId": user_id,
            })
            response.raise_for_status()
            return VerticalResponse(**response.json())
    except Exception as e:
        return VerticalResponse(vertical_id=vertical, retrieved_chunks=[f"HR service unavailable: {str(e)}"])

async def get_name_change_status(user_id: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{settings.hr_service_url}/hr/name-change/status/{user_id}")
            response.raise_for_status()
            return response.json()
    except Exception:
        return {"status": "NOT_FOUND"}
