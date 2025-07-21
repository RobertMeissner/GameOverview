from unittest import TestCase, mock

from fastapi.testclient import TestClient
from main import NewItemFoundResponse, app

client = TestClient(app)


class TestAPI(TestCase):
    def test_search_game_by_name(self):
        with mock.patch("main.game_by_app_id") as mocked_game_by_app_id:
            # Test case 1: Valid request to Steam
            mocked_game_by_app_id.return_value = {
                "name": "Example Game",
                "thumbnail_url": "",
            }
            response = client.post("/games/add", json={"name": "", "app_id": 12345, "store": "steam"})
            self.assertEqual(response.status_code, 200)
            response_data = NewItemFoundResponse(**response.json())
            self.assertEqual(response_data.name, "Example Game")
            self.assertEqual(response_data.app_id, 12345)
            self.assertEqual(response_data.store, "steam")
            self.assertEqual(response_data.thumbnail_url, "")

            # Test case 2: Valid request to GOG
            mocked_game_by_app_id.return_value = {
                "name": "Another Game",
                "thumbnail_url": "",
            }
            response = client.post(
                "/games/add",
                json={"name": "Another Game", "app_id": 67890, "store": "gog"},
            )
            self.assertEqual(response.status_code, 200)
            response_data = NewItemFoundResponse(**response.json())
            self.assertEqual(response_data.name, "Another Game")
            self.assertEqual(response_data.app_id, 67890)
            self.assertEqual(response_data.store, "gog")
            self.assertEqual(response_data.thumbnail_url, "")

            # Test case 3: Invalid store
            mocked_game_by_app_id.return_value = {"error": "wrong stor"}
            response = client.post(
                "/games/add",
                json={"name": "Invalid Game", "app_id": 11111, "store": "epic"},
            )
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"detail": "Store not found"})

            # Test case 4: Missing required fields
            response = client.post("/games/add", json={"name": "Missing App ID", "store": "steam"})
            self.assertEqual(response.status_code, 422)  # Unprocessable Entity due to missing fields

    def test_steam_search(self):
        # Test case 1: Valid request to Steam
        response = client.post("/games/add", json={"name": "", "app_id": 50, "store": "steam"})
        self.assertEqual(response.status_code, 200)
        response_data = NewItemFoundResponse(**response.json())
        self.assertEqual(response_data.name, "Half-Life: Opposing Force")
        self.assertEqual(response_data.app_id, 50)
        self.assertEqual(response_data.store, "steam")
        self.assertEqual(
            response_data.thumbnail_url,
            "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/50" "/header.jpg?t=1721932677",
        )  # Assuming the thumbnail is None for this test case
