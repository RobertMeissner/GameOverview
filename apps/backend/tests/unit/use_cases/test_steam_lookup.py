import unittest
from unittest.mock import Mock

from application.use_cases.steam_lookup import SteamLookup


class TestSteamLookup(unittest.TestCase):
    def setUp(self):
        self.mock_steam_api = Mock()
        self.steam_lookup = SteamLookup(self.mock_steam_api)

    def test_lookup_by_app_id_success(self):
        # Arrange
        app_id = 440
        expected_result = {"game_name": "Team Fortress 2", "thumbnail_url": "https://example.com/tf2.jpg"}
        self.mock_steam_api.get_game_by_app_id.return_value = expected_result

        # Act
        result = self.steam_lookup.lookup_by_app_id(app_id)

        # Assert
        self.assertEqual(result, expected_result)
        self.mock_steam_api.get_game_by_app_id.assert_called_once_with(app_id)

    def test_lookup_by_app_id_not_found(self):
        # Arrange
        app_id = 999999
        self.mock_steam_api.get_game_by_app_id.return_value = None

        # Act
        result = self.steam_lookup.lookup_by_app_id(app_id)

        # Assert
        self.assertIsNone(result)
        self.mock_steam_api.get_game_by_app_id.assert_called_once_with(app_id)

    def test_search_by_name_success(self):
        # Arrange
        game_name = "Team Fortress"
        expected_app_id = 440
        expected_matched_name = "Team Fortress 2"
        self.mock_steam_api.search_game_by_name.return_value = (expected_app_id, expected_matched_name)

        # Act
        app_id, matched_name = self.steam_lookup.search_by_name(game_name)

        # Assert
        self.assertEqual(app_id, expected_app_id)
        self.assertEqual(matched_name, expected_matched_name)
        self.mock_steam_api.search_game_by_name.assert_called_once_with(game_name)

    def test_search_by_name_no_results(self):
        # Arrange
        game_name = "NonexistentGame"
        self.mock_steam_api.search_game_by_name.return_value = (0, game_name)

        # Act
        app_id, matched_name = self.steam_lookup.search_by_name(game_name)

        # Assert
        self.assertEqual(app_id, 0)
        self.assertEqual(matched_name, game_name)
        self.mock_steam_api.search_game_by_name.assert_called_once_with(game_name)


if __name__ == "__main__":
    unittest.main()
