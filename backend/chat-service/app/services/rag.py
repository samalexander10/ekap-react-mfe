import anthropic
import weaviate
from app.config import settings

async def retrieve_context(query: str, limit: int = 3) -> list[str]:
    """Retrieve relevant HR policy context using Weaviate vector search."""
    try:
        client = weaviate.connect_to_local(
            host=settings.weaviate_url.replace("http://", "").split(":")[0],
            port=int(settings.weaviate_url.split(":")[-1]),
        )

        # Generate embedding via Anthropic (using a simple approach)
        # For POC, use keyword-based search as fallback
        collection = client.collections.get("HRPolicy")
        response = collection.query.bm25(
            query=query,
            limit=limit,
        )

        docs = [obj.properties.get("content", "") for obj in response.objects]
        client.close()
        return docs
    except Exception:
        # If Weaviate is not available or collection doesn't exist, return empty
        return []
