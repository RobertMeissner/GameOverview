.PHONY: setup run clean

main:
	cd apps/backend && uv run hexa_main.py

.PHONY: metrics metrics-detailed wily-update complexity
metrics:
	cd apps/backend && uv run radon cc . --min=C --total-average && uv run radon mi . --min=C

pre-commit:
	cd apps/backend && uv run pre-commit run -a

.PHONY: test-unit test-all test-coverage test-steam-catalog test-steam-catalog-coverage test-fast test-slow
test:
	cd apps/backend && PYTHONPATH=. uv run pytest tests/ -v

test-cov:
	cd apps/backend && uv run pytest tests/unit/ --cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=2

coverage-clean:
	cd apps/backend && rm -rf htmlcov/ .coverage .pytest_cache/ coverage-backend.xml coverage-backend.lcov

# Docker commands
.PHONY: docker-build docker-run docker-stop docker-clean docker-logs
docker-run:
	docker compose down && docker compose up

.PHONY: run
run:
	cd apps/api && bun run build && bun run dev

build:
	cd apps/api && bun run build

.PHONY: deploy
deploy:
	cd apps/api && bun run deploy:staging


.PHONY: clean
clean:
	rm -rf apps/api/static && rm -rf apps/frontend/build

.PHONY: dev dev-debug
dev:
	cd apps/api && bunx concurrently --names "API,Frontend" --prefix-colors "blue,green" "wrangler dev --env dev" "cd ../frontend && npm start"

dev-debug:
	cd apps/api && bunx concurrently --names "API,Frontend" --prefix-colors "blue,green" "wrangler dev --env dev --inspector --log-level debug" "cd ../frontend && npm start"
