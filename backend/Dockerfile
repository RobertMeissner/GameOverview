# Use the official Python 3.10 image
FROM python:3.10.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    POETRY_HOME=/opt/poetry

# Set work directory
WORKDIR /app

# Install Poetry
RUN apt-get update \
    && apt-get install -y curl build-essential


RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s $POETRY_HOME/bin/poetry /usr/local/bin/poetry \
    && poetry --version

# Copy only the needed files for dependency installation
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.in-project true \
    && poetry install --no-root --no-dev

# List installed packages to verify
RUN poetry run pip list

RUN poetry add pyarrow && poetry install --no-root --no-dev

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["poetry", "run", "python", "main.py"]
