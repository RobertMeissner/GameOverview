import unittest
from unittest.mock import patch, Mock
import requests
from adapters.steam_api.steam_api_adapter import SteamAPIAdapter


class TestSteamAPIAdapter(unittest.TestCase):
    def setUp(self):
        self.adapter = SteamAPIAdapter()

    @patch("adapters.steam_api.steam_api_adapter.requests.get")
    def test_get_game_by_app_id_success(self, mock_get):
        # Arrange
        app_id = 440
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
        result = self.adapter.get_game_by_app_id(app_id)

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["game_name"], "Team Fortress 2")
        self.assertEqual(result["thumbnail_url"], "https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg")
        mock_get.assert_called_once_with("https://store.steampowered.com/api/appdetails", params={"appids": app_id})

    @patch("adapters.steam_api.steam_api_adapter.requests.get")
    def test_get_game_by_app_id_not_found(self, mock_get):
        # Arrange
        app_id = 999999
        mock_response = Mock()
        mock_response.json.return_value = {"999999": {"success": False}}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Act
        result = self.adapter.get_game_by_app_id(app_id)

        # Assert
        self.assertIsNone(result)

    @patch("adapters.steam_api.steam_api_adapter.requests.get")
    def test_get_game_by_app_id_request_exception(self, mock_get):
        # Arrange
        app_id = 440
        mock_get.side_effect = requests.RequestException("Network error")

        # Act
        result = self.adapter.get_game_by_app_id(app_id)

        # Assert
        self.assertIsNone(result)

    @patch("adapters.steam_api.steam_api_adapter.requests.request")
    @patch("adapters.steam_api.steam_api_adapter.BeautifulSoup")
    def test_search_game_by_name_success(self, mock_soup, mock_request):
        # Arrange
        game_name = "Team Fortress"
        mock_response = Mock()
        mock_response.text = "<html>mock html</html>"
        mock_request.return_value = mock_response

        mock_match = Mock()
        mock_match_name = Mock()
        mock_match_name.text.strip.return_value = "Team Fortress 2"
        mock_match.find.return_value = mock_match_name
        mock_match.__contains__ = Mock(return_value=True)
        mock_match.__getitem__ = Mock(return_value="440")

        mock_soup_instance = Mock()
        mock_soup_instance.find_all.return_value = [mock_match]
        mock_soup.return_value = mock_soup_instance

        # Act
        app_id, matched_name = self.adapter.search_game_by_name(game_name)

        # Assert
        self.assertEqual(app_id, 440)
        self.assertEqual(matched_name, "Team Fortress 2")

    @patch("adapters.steam_api.steam_api_adapter.requests.request")
    def test_search_game_by_name_no_matches(self, mock_request):
        # Arrange
        game_name = "NonexistentGame"
        mock_response = Mock()
        mock_response.text = "<html>no matches</html>"
        mock_request.return_value = mock_response

        with patch("adapters.steam_api.steam_api_adapter.BeautifulSoup") as mock_soup:
            mock_soup_instance = Mock()
            mock_soup_instance.find_all.return_value = []
            mock_soup.return_value = mock_soup_instance

            # Act
            app_id, matched_name = self.adapter.search_game_by_name(game_name)

            # Assert
            self.assertEqual(app_id, 0)
            self.assertEqual(matched_name, game_name)

    @patch("adapters.steam_api.steam_api_adapter.requests.request")
    def test_search_game_by_name_exception(self, mock_request):
        # Arrange
        game_name = "Team Fortress"
        mock_request.side_effect = Exception("Network error")

        # Act
        app_id, matched_name = self.adapter.search_game_by_name(game_name)

        # Assert
        self.assertEqual(app_id, 0)
        self.assertEqual(matched_name, game_name)


if __name__ == "__main__":
    unittest.main()
