"""
Integration tests for HTTP Steam API client.
Tests the adapter layer with mocked HTTP requests.
"""

import json
import pytest
import requests
from unittest.mock import Mock, patch, MagicMock
from requests.exceptions import RequestException, Timeout, ConnectionError


class TestHttpSteamApiClient:
    """Test cases for HttpSteamApiClient adapter."""

    @patch("requests.get")
    def test_fetch_app_list_success(self, mock_get, sample_steam_api_response):
        """Test successfully fetching Steam app list."""
        # Mock successful HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_steam_api_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        result = client.fetch_app_list()

        assert result == sample_steam_api_response
        mock_get.assert_called_once_with("https://api.steampowered.com/ISteamApps/GetAppList/v2/", timeout=30)

    @patch("requests.get")
    def test_fetch_app_list_http_error(self, mock_get):
        """Test handling HTTP error when fetching app list."""
        # Mock HTTP error response
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.HTTPError("500 Server Error")
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        with pytest.raises(SteamApiError, match="Failed to fetch Steam app list"):
            client.fetch_app_list()

    @patch("requests.get")
    def test_fetch_app_list_timeout(self, mock_get):
        """Test handling timeout when fetching app list."""
        # Mock timeout exception
        mock_get.side_effect = Timeout("Request timed out")

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=5)

        with pytest.raises(SteamApiError, match="Request timed out"):
            client.fetch_app_list()

    @patch("requests.get")
    def test_fetch_app_list_connection_error(self, mock_get):
        """Test handling connection error when fetching app list."""
        # Mock connection error
        mock_get.side_effect = ConnectionError("Connection failed")

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        with pytest.raises(SteamApiError, match="Connection failed"):
            client.fetch_app_list()

    @patch("requests.get")
    def test_fetch_app_list_invalid_json(self, mock_get):
        """Test handling invalid JSON response when fetching app list."""
        # Mock response with invalid JSON
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        with pytest.raises(SteamApiError, match="Invalid JSON response"):
            client.fetch_app_list()

    @patch("requests.get")
    def test_fetch_game_rating_success(self, mock_get, sample_steam_rating_response):
        """Test successfully fetching game rating."""
        # Mock successful rating response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_steam_rating_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://store.steampowered.com", timeout=30)

        result = client.fetch_game_rating(220)

        assert result == sample_steam_rating_response
        mock_get.assert_called_once_with("https://store.steampowered.com/appreviews/220?json=1&num_per_page=0", timeout=30)

    @patch("requests.get")
    def test_fetch_game_rating_not_found(self, mock_get):
        """Test handling game not found when fetching rating."""
        # Mock 404 response
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = requests.HTTPError("404 Not Found")
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://store.steampowered.com", timeout=30)

        with pytest.raises(SteamApiError, match="Game not found"):
            client.fetch_game_rating(999999)

    @patch("requests.get")
    def test_fetch_game_rating_invalid_app_id(self, mock_get):
        """Test handling invalid app ID when fetching rating."""
        # Mock response indicating invalid app ID
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": 0, "error": "Invalid app ID"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://store.steampowered.com", timeout=30)

        result = client.fetch_game_rating(0)

        # Should return the error response, let the service layer handle it
        assert result["success"] == 0
        assert "error" in result

    @patch("requests.get")
    def test_search_game_suggestions_success(self, mock_get, mock_steam_search_response):
        """Test successfully searching for game suggestions."""
        # Mock successful search response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = mock_steam_search_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://store.steampowered.com", timeout=30)

        result = client.search_game_suggestions("Half-Life")

        assert result == mock_steam_search_response

        # Verify search URL was constructed correctly
        expected_url = (
            "https://store.steampowered.com/search/suggest?"
            "term=Half-Life&f=games&cc=US&realm=1&l=english&"
            "v=25120873&excluded_content_descriptors[]=3&"
            "excluded_content_descriptors[]=4&use_store_query=1&"
            "use_search_spellcheck=1&search_creators_and_tags=1"
        )
        mock_get.assert_called_once()
        actual_url = mock_get.call_args[0][0]
        assert "search/suggest" in actual_url
        assert "term=Half-Life" in actual_url

    @patch("requests.get")
    def test_search_game_suggestions_with_headers(self, mock_get):
        """Test searching with custom headers."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://store.steampowered.com", timeout=30, headers={"User-Agent": "Test Client"})

        client.search_game_suggestions("Portal")

        # Verify headers were passed
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args[1]
        assert "headers" in call_kwargs
        assert call_kwargs["headers"]["User-Agent"] == "Test Client"

    @patch("requests.get")
    def test_retry_mechanism(self, mock_get, sample_steam_api_response):
        """Test retry mechanism for transient failures."""
        # Mock first call fails, second succeeds
        mock_response_fail = Mock()
        mock_response_fail.status_code = 500
        mock_response_fail.raise_for_status.side_effect = requests.HTTPError("500 Server Error")

        mock_response_success = Mock()
        mock_response_success.status_code = 200
        mock_response_success.json.return_value = sample_steam_api_response
        mock_response_success.raise_for_status.return_value = None

        mock_get.side_effect = [mock_response_fail, mock_response_success]

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30, max_retries=2, retry_delay=0.1)

        result = client.fetch_app_list()

        assert result == sample_steam_api_response
        assert mock_get.call_count == 2

    @patch("requests.get")
    def test_retry_exhausted(self, mock_get):
        """Test behavior when all retries are exhausted."""
        # Mock all calls fail
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.HTTPError("500 Server Error")
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30, max_retries=2, retry_delay=0.1)

        with pytest.raises(SteamApiError, match="Failed to fetch Steam app list after 2 retries"):
            client.fetch_app_list()

        assert mock_get.call_count == 3  # Initial call + 2 retries

    def test_url_construction(self):
        """Test URL construction for different endpoints."""
        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        # Test app list URL
        app_list_url = client._build_app_list_url()
        assert app_list_url == "https://api.steampowered.com/ISteamApps/GetAppList/v2/"

        # Test rating URL
        rating_url = client._build_rating_url(220)
        expected_rating_url = "https://api.steampowered.com/appreviews/220?json=1&num_per_page=0"
        assert rating_url == expected_rating_url

        # Test search URL
        search_url = client._build_search_url("Half-Life", country="US", language="english")
        assert "search/suggest" in search_url
        assert "term=Half-Life" in search_url
        assert "cc=US" in search_url
        assert "l=english" in search_url

    def test_custom_configuration(self):
        """Test client with custom configuration."""
        custom_headers = {"User-Agent": "GameOverview/1.0", "Accept": "application/json"}

        client = HttpSteamApiClient(
            base_url="https://custom.steam.api.com", timeout=60, max_retries=5, retry_delay=1.0, headers=custom_headers
        )

        assert client.base_url == "https://custom.steam.api.com"
        assert client.timeout == 60
        assert client.max_retries == 5
        assert client.retry_delay == 1.0
        assert client.headers == custom_headers

    @patch("requests.get")
    def test_rate_limiting_handling(self, mock_get):
        """Test handling of rate limiting (429 responses)."""
        # Mock rate limit response
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.headers = {"Retry-After": "60"}
        mock_response.raise_for_status.side_effect = requests.HTTPError("429 Too Many Requests")
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30)

        with pytest.raises(SteamApiError, match="Rate limited"):
            client.fetch_app_list()

    @patch("requests.get")
    def test_caching_mechanism(self, mock_get, sample_steam_api_response):
        """Test caching of API responses."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = sample_steam_api_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        client = HttpSteamApiClient(
            base_url="https://api.steampowered.com",
            timeout=30,
            enable_caching=True,
            cache_ttl=300,  # 5 minutes
        )

        # First call should hit the API
        result1 = client.fetch_app_list()
        assert result1 == sample_steam_api_response
        assert mock_get.call_count == 1

        # Second call should use cache
        result2 = client.fetch_app_list()
        assert result2 == sample_steam_api_response
        assert mock_get.call_count == 1  # No additional API call

    def test_client_configuration_validation(self):
        """Test validation of client configuration parameters."""
        # Test invalid timeout
        with pytest.raises(ValueError, match="Timeout must be positive"):
            HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=-1)

        # Test invalid retry count
        with pytest.raises(ValueError, match="Max retries must be non-negative"):
            HttpSteamApiClient(base_url="https://api.steampowered.com", timeout=30, max_retries=-1)

        # Test invalid base URL
        with pytest.raises(ValueError, match="Invalid base URL"):
            HttpSteamApiClient(base_url="not-a-url", timeout=30)


class TestSteamSearchResponseParser:
    """Test cases for parsing Steam search response HTML."""

    def test_parse_search_results_multiple_matches(self, mock_steam_search_response):
        """Test parsing HTML with multiple search matches."""
        parser = SteamSearchResponseParser()

        results = parser.parse_search_results(mock_steam_search_response)

        assert len(results) == 2

        # First result
        assert results[0].app_id == 220
        assert results[0].name == "Half-Life 2"
        assert results[0].url == "/app/220/HalfLife_2/"

        # Second result
        assert results[1].app_id == 400
        assert results[1].name == "Portal"
        assert results[1].url == "/app/400/Portal/"

    def test_parse_search_results_no_matches(self):
        """Test parsing HTML with no search matches."""
        empty_html = "<html><body></body></html>"
        parser = SteamSearchResponseParser()

        results = parser.parse_search_results(empty_html)

        assert results == []

    def test_parse_search_results_malformed_html(self):
        """Test parsing malformed HTML."""
        malformed_html = "<html><body><a class='match' data-ds-appid='invalid'></body></html>"
        parser = SteamSearchResponseParser()

        # Should handle gracefully and return empty results
        results = parser.parse_search_results(malformed_html)

        assert results == []

    def test_parse_search_results_missing_attributes(self):
        """Test parsing HTML with missing required attributes."""
        incomplete_html = """
        <html>
            <body>
                <a class="match" href="/app/220/HalfLife_2/">
                    <div class="match_name">Half-Life 2</div>
                </a>
                <a class="match" data-ds-appid="400">
                    <div class="match_name">Portal</div>
                </a>
            </body>
        </html>
        """
        parser = SteamSearchResponseParser()

        results = parser.parse_search_results(incomplete_html)

        # Should only return results with all required attributes
        assert len(results) == 1
        assert results[0].app_id == 400
        assert results[0].name == "Portal"


# API client implementations that would be created
class HttpSteamApiClient:
    """HTTP-based Steam API client implementation."""

    pass


class SteamSearchResponseParser:
    """Parser for Steam search response HTML."""

    pass


# API client exceptions
class SteamApiError(Exception):
    """Exception raised when Steam API operations fail."""

    pass


# Value objects for search results
class SteamSearchResult:
    """Value object representing a Steam search result."""

    pass
