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
	radon mi . --min=C

# Detailed metrics for code review
metrics-detailed:
	radon cc . --min=A --show-complexity --total-average
	radon mi . --min=A --show
	radon raw . --summary

# Update historical tracking
wily-update:
	wily build --metrics=cyclomatic,raw,maintainability

# Focus on complex functions only
complexity:
	radon cc . --min=D --show-complexity --total-average
