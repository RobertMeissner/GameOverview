.PHONY: setup run clean

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
