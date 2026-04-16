.PHONY: up down restart logs ingest-docs build

up:
	docker compose up -d --build

down:
	docker compose down -v

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build
