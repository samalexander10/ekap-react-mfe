#!/bin/bash
set -e

KAFKA_BROKER="kafka:9092"

echo "Waiting for Kafka to be ready..."
sleep 10

create_topic() {
    local topic=$1
    local partitions=${2:-3}
    local replication=${3:-1}

    echo "Creating topic: $topic"
    kafka-topics --bootstrap-server "$KAFKA_BROKER" \
        --create \
        --if-not-exists \
        --topic "$topic" \
        --partitions "$partitions" \
        --replication-factor "$replication"
}

create_topic "hr-events" 3 1
create_topic "doc-ingestion" 3 1
create_topic "audit-events" 3 1
create_topic "name-change-notifications" 3 1

echo "Listing all topics:"
kafka-topics --bootstrap-server "$KAFKA_BROKER" --list

echo "Kafka topics initialized successfully."
