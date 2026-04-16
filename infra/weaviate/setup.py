#!/usr/bin/env python3
"""
Weaviate schema setup script.
Run after Weaviate is healthy to create the HRPolicy collection.
"""
import sys
import weaviate
import weaviate.classes as wvc

WEAVIATE_URL = "http://localhost:8080"

def setup_weaviate():
    print(f"Connecting to Weaviate at {WEAVIATE_URL}...")
    client = weaviate.connect_to_local(
        host="localhost",
        port=8080,
    )

    try:
        # Check if collection already exists
        existing = [c.name for c in client.collections.list_all().values()]
        if "HRPolicy" in existing:
            print("HRPolicy collection already exists, skipping creation.")
            return

        # Create HRPolicy collection
        client.collections.create(
            name="HRPolicy",
            description="HR policy documents and knowledge base",
            properties=[
                wvc.config.Property(
                    name="filename",
                    data_type=wvc.config.DataType.TEXT,
                    description="Source document filename",
                ),
                wvc.config.Property(
                    name="content",
                    data_type=wvc.config.DataType.TEXT,
                    description="Document content chunk",
                ),
                wvc.config.Property(
                    name="source_path",
                    data_type=wvc.config.DataType.TEXT,
                    description="MinIO object path",
                ),
            ],
        )
        print("Created HRPolicy collection successfully.")

    finally:
        client.close()


if __name__ == "__main__":
    try:
        setup_weaviate()
        print("Weaviate setup complete.")
    except Exception as e:
        print(f"Error setting up Weaviate: {e}", file=sys.stderr)
        sys.exit(1)
