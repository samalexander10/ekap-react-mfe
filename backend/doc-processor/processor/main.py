import asyncio
import json
import logging
import base64
from aiokafka import AIOKafkaConsumer
import anthropic
import weaviate
from minio import Minio

from processor.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

TOPIC = "doc-ingestion"


def get_weaviate_client():
    host_port = settings.weaviate_url.replace("http://", "").replace("https://", "")
    parts = host_port.split(":")
    host = parts[0]
    port = int(parts[1]) if len(parts) > 1 else 8080
    return weaviate.connect_to_local(host=host, port=port)


def get_minio_client():
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=False,
    )


async def extract_text_with_claude(document_bytes: bytes, content_type: str, filename: str) -> str:
    """Use Claude Vision to extract text from a document."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    # Determine media type
    media_type_map = {
        "application/pdf": "application/pdf",
        "image/jpeg": "image/jpeg",
        "image/png": "image/png",
        "image/gif": "image/gif",
        "image/webp": "image/webp",
    }
    media_type = media_type_map.get(content_type, "image/jpeg")
    b64_data = base64.standard_b64encode(document_bytes).decode("utf-8")

    message = await client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": f"""You are a document text extractor for an HR knowledge base.

Extract ALL text from this HR document: {filename}

Instructions:
- Extract all readable text faithfully
- Preserve section headings and structure
- Include all policy details, dates, and references
- Format clearly with proper line breaks
- Do not summarize - extract the full content

Extracted text:""",
                    },
                ],
            }
        ],
    )

    return message.content[0].text


async def embed_text_with_claude(text: str) -> list[float]:
    """Generate a simple embedding (placeholder - Weaviate can embed internally)."""
    # For POC, return a zero vector; in production use an embedding model
    return [0.0] * 1536


async def store_in_weaviate(filename: str, content: str, source_path: str):
    """Store extracted document content in Weaviate."""
    try:
        wv_client = get_weaviate_client()

        # Ensure collection exists
        try:
            collection = wv_client.collections.get("HRPolicy")
        except Exception:
            wv_client.collections.create(
                name="HRPolicy",
                properties=[
                    weaviate.classes.config.Property(name="filename", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="content", data_type=weaviate.classes.config.DataType.TEXT),
                    weaviate.classes.config.Property(name="source_path", data_type=weaviate.classes.config.DataType.TEXT),
                ],
            )
            collection = wv_client.collections.get("HRPolicy")

        # Split into chunks of ~500 words
        words = content.split()
        chunk_size = 500
        chunks = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

        for i, chunk in enumerate(chunks):
            collection.data.insert({
                "filename": filename,
                "content": chunk,
                "source_path": f"{source_path}#chunk-{i}",
            })
            log.info(f"Stored chunk {i+1}/{len(chunks)} for {filename}")

        wv_client.close()
        log.info(f"Successfully stored {len(chunks)} chunks for {filename}")

    except Exception as e:
        log.error(f"Failed to store in Weaviate: {e}")
        raise


async def process_message(msg):
    """Process a single Kafka message."""
    try:
        data = json.loads(msg.value.decode("utf-8"))
        log.info(f"Processing document: {data}")

        bucket = data.get("bucket", "hr-documents")
        object_path = data.get("objectPath")
        filename = data.get("filename", object_path.split("/")[-1] if object_path else "unknown")
        content_type = data.get("contentType", "image/jpeg")

        if not object_path:
            log.error("No objectPath in message")
            return

        # Download from MinIO
        minio_client = get_minio_client()
        response = minio_client.get_object(bucket, object_path)
        document_bytes = response.read()
        response.close()
        log.info(f"Downloaded {len(document_bytes)} bytes from MinIO: {object_path}")

        # Extract text with Claude Vision
        extracted_text = await extract_text_with_claude(document_bytes, content_type, filename)
        log.info(f"Extracted {len(extracted_text)} characters from {filename}")

        # Store in Weaviate
        await store_in_weaviate(filename, extracted_text, object_path)
        log.info(f"Successfully processed document: {filename}")

    except Exception as e:
        log.error(f"Error processing message: {e}", exc_info=True)


async def main():
    log.info("Starting doc-processor consumer...")
    log.info(f"Connecting to Kafka: {settings.kafka_bootstrap_servers}")

    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="doc-processor-group",
        auto_offset_reset="earliest",
    )

    await consumer.start()
    log.info(f"Subscribed to topic: {TOPIC}")

    try:
        async for msg in consumer:
            log.info(f"Received message from partition {msg.partition} offset {msg.offset}")
            await process_message(msg)
    except Exception as e:
        log.error(f"Consumer error: {e}", exc_info=True)
    finally:
        await consumer.stop()
        log.info("Consumer stopped")


if __name__ == "__main__":
    asyncio.run(main())
