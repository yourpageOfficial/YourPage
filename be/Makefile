.PHONY: dev build test lint migrate-up migrate-down migrate-create swag tidy

dev:
	docker compose -f ../../docker-compose.yml up be

build:
	docker build -t yourpage-be:latest .

test:
	docker compose -f ../../docker-compose.yml run --rm be-test

lint:
	docker run --rm -v $(PWD):/app -w /app golangci/golangci-lint:v1.62 golangci-lint run ./... --timeout=5m

migrate-up:
	docker compose -f ../../docker-compose.yml run --rm migrate

migrate-down:
	docker compose -f ../../docker-compose.yml run --rm migrate-down

migrate-create:
	@read -p "Migration name: " name; \
	docker compose -f ../../docker-compose.yml run --rm goose create $${name} sql

swag:
	docker run --rm -v $(PWD):/app -w /app golang:1.23-alpine sh -c "go install github.com/swaggo/swag/cmd/swag@latest && swag init -g cmd/api/main.go -o docs"

tidy:
	docker run --rm -v $(PWD):/app -w /app golang:1.23-alpine go mod tidy
