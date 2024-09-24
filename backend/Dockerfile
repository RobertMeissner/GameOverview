# Use the official Python 3.10 image
FROM python:3.10.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    POETRY_HOME=/opt/poetry \
    POETRY_VERSION=1.8.3

# Set work directory
WORKDIR .

# Install Poetry and other dependencies
RUN apt-get update \
    && apt-get install -y curl build-essential

RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Download and install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Ensure Poetry is in PATH and accessible
ENV PATH="$POETRY_HOME/bin:$PATH"

# Copy only the needed files for dependency installation
COPY pyproject.toml poetry.lock ./

# Install Python dependencies specified in pyproject.toml
RUN poetry config virtualenvs.in-project true \
    && poetry install --no-root --no-dev

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

CMD ["poetry", "run", "python", "main.py"]
