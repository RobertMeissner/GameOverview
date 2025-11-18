import unittest
from unittest.mock import patch, Mock
import sys
import os
from fastapi.testclient import TestClient

from hexa_main import app, get_game_service


class TestHexaMainAPI(unittest.TestCase):
    """Integration tests for the FastAPI endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_steam_lookup_endpoint_success(self):
        """Test the Steam lookup endpoint with successful response."""
        # Arrange
        mock_service = Mock()
        mock_service.lookup_steam_game_by_app_id.return_value = {
            "game_name": "Team Fortress 2",
            "thumbnail_url": "https://example.com/tf2.jpg",
        }

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        try:
            # Act
            response = self.client.get("/api/steam/lookup/440")

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIsNotNone(data["game"])
            self.assertEqual(data["game"]["game_name"], "Team Fortress 2")
            mock_service.lookup_steam_game_by_app_id.assert_called_once_with(440)
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_steam_lookup_endpoint_not_found(self):
        """Test the Steam lookup endpoint when game is not found."""
        # Arrange
        mock_service = Mock()
        mock_service.lookup_steam_game_by_app_id.return_value = None

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        try:
            # Act
            response = self.client.get("/api/steam/lookup/999999")

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"], "Game not found")
            self.assertIsNone(data["game"])
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_steam_search_endpoint(self):
        """Test the Steam search endpoint."""
        # Arrange
        mock_service = Mock()
        mock_service.search_steam_game_by_name.return_value = (440, "Team Fortress 2")

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        try:
            # Act
            response = self.client.get("/api/steam/search?name=Team Fortress 2")

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["app_id"], 440)
            self.assertEqual(data["name"], "Team Fortress 2")
            mock_service.search_steam_game_by_name.assert_called_once_with("Team Fortress 2")
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_add_game_endpoint_steam_success(self):
        """Test the add game endpoint with Steam game."""
        # Arrange
        mock_service = Mock()
        mock_service.lookup_steam_game_by_app_id.return_value = {"game_name": "Half-Life 2", "thumbnail_url": "https://example.com/hl2.jpg"}

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        game_data = {"name": "Half-Life 2", "app_id": "220", "store": "steam", "status": "backlog"}

        try:
            # Act
            response = self.client.post("/api/games", json=game_data)

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIsNotNone(data["game"])
            self.assertEqual(data["game"]["game_name"], "Half-Life 2")
            self.assertEqual(data["game"]["app_id"], 220)
            self.assertEqual(data["game"]["store"], "steam")
            mock_service.lookup_steam_game_by_app_id.assert_called_once_with(220)
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_add_game_endpoint_steam_not_found(self):
        """Test the add game endpoint when Steam game is not found."""
        # Arrange
        mock_service = Mock()
        mock_service.lookup_steam_game_by_app_id.return_value = None

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        game_data = {"name": "NonexistentGame", "app_id": "999999", "store": "steam", "status": "backlog"}

        try:
            # Act
            response = self.client.post("/api/games", json=game_data)

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"], "Steam game not found")
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_add_game_endpoint_non_steam(self):
        """Test the add game endpoint with non-Steam game."""
        # Arrange
        mock_service = Mock()

        # Override dependency
        app.dependency_overrides[get_game_service] = lambda: mock_service

        game_data = {"name": "GOG Game", "app_id": "12345", "store": "gog", "status": "wishlist"}

        try:
            # Act
            response = self.client.post("/api/games", json=game_data)

            # Assert
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIsNotNone(data["game"])
            self.assertEqual(data["game"]["game_name"], "GOG Game")
            self.assertEqual(data["game"]["store"], "gog")
            # Should not call Steam lookup for non-Steam games
            mock_service.lookup_steam_game_by_app_id.assert_not_called()
        finally:
            # Clean up
            app.dependency_overrides.clear()

    def test_health_endpoint(self):
        """Test basic health/root endpoint."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 404)  # Root not implemented in hexa_main


if __name__ == "__main__":
    unittest.main()
