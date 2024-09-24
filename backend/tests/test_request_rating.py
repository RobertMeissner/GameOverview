import json
import os
import unittest
from unittest import skip
from unittest.mock import Mock, patch

import pandas as pd
import requests

from backend.src.request_rating import request_rating


class TestRequestRating(unittest.TestCase):
    @skip(reason="API currently WIP")
    @patch("requests.request")
    @patch("os.getenv", return_value="MockAPIKey")
    def test_successful_api_responses(self, mock_getenv, mock_request):
        # Mock request setup
        mock_request.side_effect = [
            Mock(
                status_code=200,
                text=json.dumps(
                    {
                        "hits": [
                            {
                                "id": "12345",
                                "_highlightResult": {
                                    "name": {"value": "<strong>Cyberpunk</strong> 2077"}
                                },
                            }
                        ]
                    }
                ),
            ),
            Mock(
                status_code=200,
                text=json.dumps(
                    {
                        "success": 1,
                        "query_summary": {
                            "total_reviews": 100,
                            "total_positive": 80,
                        },
                    }
                ),
            ),
        ]

        # Create a Pandas Series simulating the database row
        df = pd.Series(
            {"name": "Cyberpunk 2077", "corrected_app_id": 0, "app_id": 0, "rating": 0}
        )
        result = request_rating(df)
        # Check the returned dataframe
        self.assertEqual(result["app_id"], "12345")
        self.assertAlmostEqual(result["rating"], 0.8)

    @patch("requests.request")
    def test_no_results_from_algolia(self, mock_request):
        # Mock request for Algolia returning empty hits
        mock_request.return_value = Mock(status_code=200, text=json.dumps({"hits": []}))

        df = pd.Series({"name": "Unknown Game", "app_id": "12345", "rating": 0})
        result = request_rating(df)
        self.assertTrue(result.shape == (3,))

    @patch("requests.request")
    def test_algolia_api_failure(self, mock_request):
        # Mock request for Algolia returning failure
        mock_request.return_value = Mock(status_code=500)

        df = pd.Series({"name": "Cyberpunk 2077", "app_id": "12345", "rating": 0})
        with self.assertLogs(level="ERROR") as log:
            request_rating(df)
            self.assertIn("An error occurred", log.output[0])

    @patch("requests.request")
    def test_exception_handling(self, mock_request):
        # Setup the side_effect to raise an exception on the request call
        mock_request.side_effect = Exception("Test Exception")

        df = pd.Series(
            {
                "name": "Faulty Game",
                "app_id": "12345",
                "rating": 0,
                "corrected_app_id": 0,
            }
        )
        with self.assertLogs(level="ERROR") as log:
            # No real assertions on result as we're focusing on exception logging
            request_rating(df)
            self.assertIn("An error occurred", log.output[0])
            self.assertIn("Test Exception", log.output[0])

    @skip(reason="API currently not implemented")
    def test_rating_api_steam(self):
        """Test that the real API provides a successful response and has a suitable structure."""
        # Setup for real API call (Note: This uses the Algolia API for demonstration)
        url = "https://94he6yatei-dsn.algolia.net/1/indexes/all_names/query?x-algolia-agent=SteamDB%20Autocompletion"
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "x-algolia-application-id": "94HE6YATEI",
            "x-algolia-api-key": os.getenv("ALGOLIA_API_KEY", ""),
            "Content-Type": "text/plain;charset=UTF-8",
            "Origin": "https://steamdb.info",
            "Referer": "https://steamdb.info/",
        }
        payload = json.dumps(
            {
                "hitsPerPage": 3,
                "attributesToSnippet": None,
                "attributesToHighlight": "name",
                "query": "Cyberpunk 2077",  # Example game name
            }
        )

        # Execute the real API call
        response = requests.post(url, headers=headers, data=payload)

        # Assert that the HTTP status code is 200
        self.assertEqual(
            response.status_code, 200, "API did not return a success status code."
        )

        # Load the JSON data from the response
        data = response.json()

        # Asserts for structure parsing - based on your function's requirements
        self.assertIn("hits", data, "Response JSON does not contain 'hits'")
        self.assertIsInstance(data["hits"], list, "'hits' should be a list")
        self.assertGreater(len(data["hits"]), 0, "No hits found in the response")
        self.assertIn("id", data["hits"][0], "First hit does not contain 'id'")
        self.assertIn(
            "_highlightResult",
            data["hits"][0],
            "First hit does not contain '_highlightResult'",
        )
        self.assertIn(
            "name",
            data["hits"][0]["_highlightResult"],
            "Highlight results do not contain 'name'",
        )
        self.assertIn(
            "value",
            data["hits"][0]["_highlightResult"]["name"],
            "name key does not contain 'value'",
        )


if __name__ == "__main__":
    unittest.main()
