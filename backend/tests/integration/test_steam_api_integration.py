import unittest
from unittest.mock import patch, Mock, MagicMock
import sys
import os

from adapters.steam_api.steam_api_adapter import SteamAPIAdapter
from application.use_cases.steam_lookup import SteamLookup
from application.services.game_service import GameService
from infrastructure.factories.steam_api_factory import create_steam_api


class TestSteamAPIIntegration(unittest.TestCase):
    """Integration tests for Steam API functionality."""

    def setUp(self):
        self.steam_api = create_steam_api()
        self.steam_lookup = SteamLookup(self.steam_api)

    @patch("src.adapters.steam_api.steam_api_adapter.requests.get")
    def test_steam_lookup_integration_with_mocked_api(self, mock_get):
        """Test the full integration flow with mocked external API."""
        # Arrange - Mock successful Steam API response

        mock_response = Mock()
        mock_response.json.return_value = {
            "440": {
                "success": True,
                "data": {"name": "Team Fortress 2", "header_image": "https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg"},
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Act
        result = self.steam_lookup.lookup_by_app_id(440)

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["game_name"], "Team Fortress 2")
        self.assertIn("thumbnail_url", result)

    @unittest.skip("Complex mocking - tested in unit tests")
    def test_steam_search_integration_with_mocked_api(self):
        """Test the full search integration flow with mocked external API."""
        # This test is complex to mock properly due to BeautifulSoup HTML parsing
        # The functionality is adequately tested in unit tests
        pass

    def test_game_service_steam_integration(self):
        """Test GameService integration with Steam API."""
        # Arrange
        steam_api_factory = create_steam_api
        game_service = GameService(
            catalog_factory=lambda: None,  # We're not testing catalog functionality
            steam_api_factory=steam_api_factory,
        )

        # Mock the Steam API calls to avoid external dependencies
        with patch.object(game_service._steam_api_factory(), "get_game_by_app_id") as mock_lookup:
            mock_lookup.return_value = {"game_name": "Half-Life 2", "thumbnail_url": "https://example.com/hl2.jpg"}

            # Act
            result = game_service.lookup_steam_game_by_app_id(220)

            # Assert
            self.assertIsNotNone(result)
            self.assertEqual(result["game_name"], "Half-Life 2")


class TestSteamAPIRealIntegration(unittest.TestCase):
    """Real integration tests (these hit actual Steam API - use sparingly)."""

    @unittest.skip("Skip real API calls in CI/CD - enable for manual testing")
    def test_real_steam_api_lookup(self):
        """Test with real Steam API - Team Fortress 2 (app_id: 440)."""
        steam_api = SteamAPIAdapter()
        result = steam_api.get_game_by_app_id(440)

        self.assertIsNotNone(result)
        self.assertIn("game_name", result)
        self.assertIn("thumbnail_url", result)
        # Team Fortress 2 should always exist
        self.assertEqual(result["game_name"], "Team Fortress 2")

    @unittest.skip("Skip real API calls in CI/CD - enable for manual testing")
    def test_real_steam_search(self):
        """Test with real Steam search API."""
        steam_api = SteamAPIAdapter()
        app_id, matched_name = steam_api.search_game_by_name("Half-Life")

        self.assertGreater(app_id, 0)
        self.assertIn("Half-Life", matched_name)


if __name__ == "__main__":
    unittest.main()
