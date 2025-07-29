"""
Test fixtures for Steam catalog hexagonal architecture tests.
"""

import json
import os
import tempfile
from typing import Dict, Any
from unittest.mock import Mock, patch
import pytest
import pandas as pd


@pytest.fixture
def sample_steam_api_response() -> Dict[str, Any]:
    """Sample Steam API response for testing."""
    return {
        "applist": {
            "apps": [
                {"appid": 220, "name": "Half-Life 2"},
                {"appid": 400, "name": "Portal"},
                {"appid": 440, "name": "Team Fortress 2"},
                {"appid": 570, "name": "Dota 2"},
                {"appid": 730, "name": "Counter-Strike: Global Offensive"},
                {"appid": 4000, "name": "Garry's Mod"},
                {"appid": 105600, "name": "Terraria"},
                {"appid": 252490, "name": "Rust"},
                {"appid": 271590, "name": "Grand Theft Auto V"},
                {"appid": 292030, "name": "The Witcher 3: Wild Hunt"},
            ]
        }
    }


@pytest.fixture
def sample_catalog_dict() -> Dict[str, int]:
    """Sample catalog dictionary for testing."""
    return {
        "Half-Life 2": 220,
        "Portal": 400,
        "Team Fortress 2": 440,
        "Dota 2": 570,
        "Counter-Strike: Global Offensive": 730,
        "Garry's Mod": 4000,
        "Terraria": 105600,
        "Rust": 252490,
        "Grand Theft Auto V": 271590,
        "The Witcher 3: Wild Hunt": 292030,
    }


@pytest.fixture
def temp_catalog_file(sample_catalog_dict) -> str:
    """Create a temporary catalog file for testing."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(sample_catalog_dict, f, indent=2)
        temp_path = f.name

    yield temp_path

    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)


@pytest.fixture
def empty_temp_catalog_file() -> str:
    """Create an empty temporary catalog file for testing."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump({}, f)
        temp_path = f.name

    yield temp_path

    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)


@pytest.fixture
def nonexistent_catalog_file() -> str:
    """Path to a non-existent catalog file for testing."""
    return "/tmp/nonexistent_catalog_file.json"


@pytest.fixture
def sample_steam_rating_response() -> Dict[str, Any]:
    """Sample Steam rating API response for testing."""
    return {
        "success": 1,
        "query_summary": {
            "num_reviews": 150000,
            "review_score": 9,
            "review_score_desc": "Overwhelmingly Positive",
            "total_positive": 135000,
            "total_negative": 15000,
            "total_reviews": 150000,
        },
    }


@pytest.fixture
def sample_game_data() -> pd.DataFrame:
    """Sample game DataFrame for testing."""
    return pd.DataFrame(
        [
            {
                "name": "Half-Life 2",
                "store": "steam",
                "played": False,
                "app_id": 0,  # Will be updated by catalog
                "rating": None,
                "corrected_app_id": 0,
            },
            {"name": "Portal", "store": "steam", "played": True, "app_id": 400, "rating": 0.95, "corrected_app_id": 0},
            {"name": "Unknown Game", "store": "steam", "played": False, "app_id": 0, "rating": None, "corrected_app_id": 0},
        ]
    )


@pytest.fixture
def mock_steam_search_response():
    """Mock HTML response for Steam search suggestions."""
    return """
    <html>
        <body>
            <a class="match" data-ds-appid="220" href="/app/220/HalfLife_2/">
                <div class="match_name">Half-Life 2</div>
            </a>
            <a class="match" data-ds-appid="400" href="/app/400/Portal/">
                <div class="match_name">Portal</div>
            </a>
        </body>
    </html>
    """


@pytest.fixture
def steam_config():
    """Sample Steam configuration for testing."""
    return {
        "catalog_file_path": "/tmp/steam_catalog.json",
        "api_base_url": "https://api.steampowered.com",
        "api_timeout": 30,
        "search_url": "https://store.steampowered.com/search/suggest",
        "rating_url_template": "https://store.steampowered.com/appreviews/{}/json=1&num_per_page=0",
    }


@pytest.fixture
def mock_requests_session():
    """Mock requests session for testing HTTP calls."""
    session = Mock()
    session.get = Mock()
    return session


class MockSteamApiClient:
    """Mock Steam API client for testing."""

    def __init__(self, response_data: Dict[str, Any]):
        self.response_data = response_data
        self.call_count = 0

    def fetch_app_list(self) -> Dict[str, Any]:
        self.call_count += 1
        return self.response_data

    def fetch_game_rating(self, app_id: int) -> Dict[str, Any]:
        self.call_count += 1
        return {
            "success": 1,
            "query_summary": {"num_reviews": 1000, "review_score": 9, "total_positive": 900, "total_negative": 100, "total_reviews": 1000},
        }

    def search_game_suggestions(self, query: str) -> str:
        self.call_count += 1
        return f'<a class="match" data-ds-appid="220">Half-Life 2</a>'


class MockCatalogRepository:
    """Mock catalog repository for testing."""

    def __init__(self, initial_catalog: Dict[str, int] = None):
        self.catalog = initial_catalog or {}
        self.load_count = 0
        self.save_count = 0

    def load_catalog(self) -> Dict[str, int]:
        self.load_count += 1
        return self.catalog.copy()

    def save_catalog(self, catalog: Dict[str, int]) -> None:
        self.save_count += 1
        self.catalog = catalog.copy()

    def catalog_exists(self) -> bool:
        return bool(self.catalog)


@pytest.fixture
def mock_catalog_repository(sample_catalog_dict):
    """Mock catalog repository fixture."""
    return MockCatalogRepository(sample_catalog_dict)


@pytest.fixture
def empty_mock_catalog_repository():
    """Empty mock catalog repository fixture."""
    return MockCatalogRepository()


@pytest.fixture
def mock_steam_api_client(sample_steam_api_response):
    """Mock Steam API client fixture."""
    return MockSteamApiClient(sample_steam_api_response)


# Environment variable fixtures
@pytest.fixture
def mock_steam_env_vars():
    """Mock Steam-related environment variables."""
    with patch.dict(
        os.environ, {"STEAM_API_KEY": "test_api_key", "STEAM_ID": "76561198000000000", "STEAM_CATALOG_FILE": "/tmp/test_steam_catalog.json"}
    ):
        yield


# Pandas-related fixtures for integration with existing code
@pytest.fixture
def game_constants():
    """Constants used in the existing game processing code."""
    return {
        "game_name": "name",
        "store_name": "store",
        "played_flag": "played",
        "APP_ID": "app_id",
        "CORRECTED_APP_ID": "corrected_app_id",
        "RATING_FIELD": "rating",
        "found_game_name": "found_game_name",
        "MINIMUM_RATING": 0.8,
    }
