.PHONY: setup run clean

main:
	cd backend && uv run hexa_main.py

wily:
	uv run pip install radon wily

.PHONY: metrics metrics-detailed wily-update complexity

# Quick metrics overview
metrics:
	cd backend
	@echo "=== Complexity Report ==="
	uv run radon cc . --min=C --total-average
	@echo "\n=== Maintainability Report ==="
	uv run radon mi . --min=C

# Detailed metrics for code review
metrics-detailed:
	uv run radon cc . --min=A --show-complexity --total-average
	uv run radon mi . --min=A --show
	uv run radon raw . --summary

# Update historical tracking
wily-update:
	uv run wily build --operators=cyclomatic,raw,maintainability

# Focus on complex functions only
complexity:
	uv run radon cc . --min=D --show-complexity --total-average

pre-commit:
	cd backend && uv run pre-commit run -a

# Test and coverage commands
.PHONY: test test-coverage test-steam-catalog test-steam-catalog-coverage test-fast test-slow

# Run all working backend tests
test:
	cd backend && uv run pytest tests/unit/ -v

# Run tests with coverage report
test-coverage:
	cd backend && uv run pytest tests/unit/ --cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=2

# Coverage report for existing Steam adapter
test-steam-adapter-coverage:
	cd backend && uv run pytest tests/unit/adapters/ --cov=src.adapters --cov-report=term-missing --cov-report=html:htmlcov/adapters -v

# Coverage report for all src modules (shows current state)
test-full-coverage:
	cd backend && uv run pytest tests/unit/ --cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-branch -v

# Coverage in formats compatible with qlty
test-coverage-qlty:
	cd backend && uv run pytest tests/unit/ --cov=src --cov-report=xml:coverage-backend.xml --cov-report=lcov:coverage-backend.lcov --cov-report=term-missing -v

# Run Steam catalog hexagonal architecture tests (when implemented)
test-steam-catalog:
	@echo "Steam catalog hexagonal architecture tests created but require implementation"
	@echo "Tests are in: backend/tests/steam_catalog/"
	@echo "Run 'ls backend/tests/steam_catalog/' to see test structure"

# Quick coverage demo on existing code (working example)
coverage-demo:
	@echo "=== Coverage Demo on Steam JSON Catalog Adapter ==="
	cd backend && uv run pytest tests/unit/adapters/test_steam_json_catalog_adapter.py --cov=src --cov-report=term-missing -v

# Show coverage HTML report (after running test-coverage)
coverage-html:
	@echo "Opening coverage report..."
	@echo "HTML report available at: backend/htmlcov/index.html"
	@if [ -f backend/htmlcov/index.html ]; then echo "✓ Report exists"; else echo "✗ Run 'make test-coverage' first"; fi

# Test qlty coverage upload locally (requires QLTY_COVERAGE_TOKEN)
test-qlty-upload:
	@echo "=== Testing Qlty Coverage Upload ==="
	@if [ -z "$$QLTY_COVERAGE_TOKEN" ]; then echo "❌ QLTY_COVERAGE_TOKEN not set"; exit 1; fi
	cd backend && make test-coverage-qlty
	@if [ -f backend/coverage-backend.xml ]; then \
		echo "✓ Found coverage-backend.xml, uploading to Qlty..."; \
		cd backend && qlty coverage publish coverage-backend.xml --framework python; \
	else \
		echo "❌ coverage-backend.xml not found"; \
		exit 1; \
	fi

# Clean coverage artifacts
coverage-clean:
	cd backend && rm -rf htmlcov/ .coverage .pytest_cache/ coverage-backend.xml coverage-backend.lcov
