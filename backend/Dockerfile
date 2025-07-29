# Use the official Python 3.10 image
FROM python:3.10.12-slim

# Set environment variables for Python and uv
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Copy dependency files first for better Docker layer caching
COPY pyproject.toml ./

# Install Python dependencies using uv
RUN uv pip install --system --no-cache-dir -r pyproject.toml

# Copy the rest of the application
COPY . .

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port (Fly.io will override this with PORT env var)
EXPOSE 8001

# Health check for Fly.io
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/api/games/catalog || exit 1

# Use uvicorn directly for production deployment with configurable port
CMD uvicorn hexa_main:app --host 0.0.0.0 --port ${PORT:-8001}
