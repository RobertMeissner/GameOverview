"""
End-to-end tests for cache integration with use cases.
Tests that use cases only interact with cache abstraction, not underlying storage.
"""

import json
import os
import tempfile
import pytest
import pandas as pd
from unittest.mock import patch, Mock
from typing import List, Dict

# Import required classes
from ..conftest import MockSteamApiClient
from ..unit.test_domain_entities import SteamAppId, GameName
from ..unit.test_catalog_cache import SteamCatalogCache
from ..integration.test_json_catalog_repository import JsonCatalogRepository, ParquetCatalogRepository, InMemoryCatalogRepository
from ..integration.test_cache_persistence_strategies import CachePersistenceStrategy, CacheWriteStrategy


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestCacheUseCaseIntegration:
    """Test integration of cache with domain use cases."""

    def test_game_enrichment_use_case_with_cache(self, sample_game_data, sample_steam_api_response):
        """Test game enrichment use case using only cache interface."""
        # Setup cache with both JSON and API data sources
        catalog_dict = {app["name"]: app["appid"] for app in sample_steam_api_response["applist"]["apps"]}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(catalog_dict, f, indent=2)
            catalog_file = f.name

        try:
            # Create cache (abstraction layer)
            repository = JsonCatalogRepository(catalog_file)
            api_client = MockSteamApiClient(sample_steam_api_response)

            cache = SteamCatalogCache(repository, api_client, strategy=CachePersistenceStrategy.HYBRID)

            # Use case only sees cache interface
            enrichment_use_case = GameEnrichmentUseCase(cache)

            # Execute use case
            enriched_df = enrichment_use_case.enrich_games_with_app_ids(sample_game_data.copy())

            # Verify results
            hl2_row = enriched_df[enriched_df["name"] == "Half-Life 2"].iloc[0]
            assert hl2_row["app_id"] == 220
            assert hl2_row["found_game_name"] == "Half-Life 2"

            portal_row = enriched_df[enriched_df["name"] == "Portal"].iloc[0]
            assert portal_row["app_id"] == 400

            # Use case doesn't know about underlying storage
            assert not hasattr(enrichment_use_case, "_repository")
            assert not hasattr(enrichment_use_case, "_api_client")
            assert hasattr(enrichment_use_case, "_cache")

        finally:
            os.unlink(catalog_file)

    def test_game_discovery_use_case_with_cache(self, sample_steam_api_response):
        """Test game discovery use case that finds new games via cache."""
        # Start with partial local catalog
        partial_catalog = {"Half-Life 2": 220, "Portal": 400}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(partial_catalog, f, indent=2)
            catalog_file = f.name

        try:
            repository = JsonCatalogRepository(catalog_file)
            api_client = MockSteamApiClient(sample_steam_api_response)

            cache = SteamCatalogCache(repository, api_client, strategy=CachePersistenceStrategy.HYBRID, auto_refresh_on_miss=True)

            # Discovery use case
            discovery_use_case = GameDiscoveryUseCase(cache)

            # Search for games not in local catalog
            search_terms = ["Team Fortress", "Dota", "Counter-Strike"]
            discovered_games = discovery_use_case.discover_games_by_search_terms(search_terms)

            # Should find games via API fallback
            assert len(discovered_games) > 0

            expected_games = {"Team Fortress 2": 440, "Dota 2": 570, "Counter-Strike: Global Offensive": 730}

            for game_name, expected_app_id in expected_games.items():
                found_game = next((g for g in discovered_games if g.name.value == game_name), None)
                assert found_game is not None
                assert found_game.app_id.value == expected_app_id

            # Cache should now contain discovered games
            for game_name, expected_app_id in expected_games.items():
                cached_app_id = cache.get_app_id(game_name)
                assert cached_app_id.value == expected_app_id

        finally:
            os.unlink(catalog_file)

    def test_game_recommendation_use_case_with_cache(self, sample_steam_rating_response):
        """Test game recommendation use case using cached data."""
        # Setup cache with game ratings
        catalog_with_ratings = {"Excellent Game": 10001, "Good Game": 10002, "Average Game": 10003, "Poor Game": 10004}

        repository = InMemoryCatalogRepository(catalog_with_ratings)
        api_client = MockSteamApiClient({})

        # Mock rating responses
        def mock_rating_response(app_id):
            rating_map = {
                10001: {"success": 1, "query_summary": {"total_positive": 950, "total_reviews": 1000}},
                10002: {"success": 1, "query_summary": {"total_positive": 800, "total_reviews": 1000}},
                10003: {"success": 1, "query_summary": {"total_positive": 600, "total_reviews": 1000}},
                10004: {"success": 1, "query_summary": {"total_positive": 200, "total_reviews": 1000}},
            }
            return rating_map.get(app_id, {"success": 0})

        api_client.fetch_game_rating = mock_rating_response

        cache = SteamCatalogCache(repository, api_client)

        # Recommendation use case
        recommendation_use_case = GameRecommendationUseCase(cache)

        # Get game recommendations
        user_games = ["Excellent Game", "Good Game", "Average Game", "Poor Game"]
        recommendations = recommendation_use_case.get_highly_rated_games(user_games, min_rating=0.7)

        # Should recommend highly rated games only
        assert len(recommendations) == 2

        recommended_names = [rec.name.value for rec in recommendations]
        assert "Excellent Game" in recommended_names
        assert "Good Game" in recommended_names
        assert "Average Game" not in recommended_names
        assert "Poor Game" not in recommended_names

    def test_game_library_management_use_case(self, sample_game_data):
        """Test game library management use case with cache persistence."""
        # User's game library data
        library_catalog = {"Half-Life 2": 220, "Portal": 400, "User Added Game": 99999}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(library_catalog, f, indent=2)
            catalog_file = f.name

        try:
            repository = JsonCatalogRepository(catalog_file)
            api_client = MockSteamApiClient({})

            cache = SteamCatalogCache(repository, api_client, write_strategy=CacheWriteStrategy.WRITE_THROUGH)

            # Library management use case
            library_use_case = GameLibraryManagementUseCase(cache)

            # Add new game to library
            library_use_case.add_game_to_library("New Library Game", 88888)

            # Verify it's in cache
            app_id = cache.get_app_id("New Library Game")
            assert app_id.value == 88888

            # Verify it's persisted to file
            with open(catalog_file, "r") as f:
                updated_catalog = json.load(f)
            assert updated_catalog["New Library Game"] == 88888

            # Update existing game
            library_use_case.update_game_app_id("User Added Game", 77777)

            # Verify update
            updated_app_id = cache.get_app_id("User Added Game")
            assert updated_app_id.value == 77777

            # Remove game from library
            library_use_case.remove_game_from_library("User Added Game")

            # Verify removal
            removed_app_id = cache.get_app_id("User Added Game")
            assert removed_app_id.value == 0  # Not found

        finally:
            os.unlink(catalog_file)

    def test_cache_abstracts_multiple_data_sources(self, sample_steam_api_response):
        """Test that cache properly abstracts multiple data sources from use cases."""
        # Setup multiple data sources

        # Local JSON catalog (some games)
        json_catalog = {"Half-Life 2": 220, "Portal": 400}
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(json_catalog, f, indent=2)
            json_file = f.name

        # Parquet catalog (different games)
        parquet_catalog = pd.DataFrame({"name": ["Team Fortress 2", "Dota 2"], "app_id": [440, 570]})
        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as f:
            parquet_file = f.name
            parquet_catalog.to_parquet(parquet_file)

        try:
            # Create cache that aggregates multiple sources
            json_repository = JsonCatalogRepository(json_file)
            parquet_repository = ParquetCatalogRepository(parquet_file)
            api_client = MockSteamApiClient(sample_steam_api_response)

            cache = MultiSourceSteamCatalogCache([json_repository, parquet_repository], api_client)

            # Use case only sees unified cache interface
            unified_use_case = UnifiedGameLookupUseCase(cache)

            # Should find games from all sources
            games_to_find = [
                "Half-Life 2",  # From JSON
                "Team Fortress 2",  # From Parquet
                "Terraria",  # From API (fallback)
            ]

            found_games = unified_use_case.lookup_games(games_to_find)

            assert len(found_games) == 3
            assert found_games["Half-Life 2"] == SteamAppId(220)
            assert found_games["Team Fortress 2"] == SteamAppId(440)
            assert found_games["Terraria"] == SteamAppId(105600)

            # Use case doesn't know about different source types
            assert not hasattr(unified_use_case, "_json_repository")
            assert not hasattr(unified_use_case, "_parquet_repository")
            assert not hasattr(unified_use_case, "_api_client")
            assert hasattr(unified_use_case, "_cache")

        finally:
            os.unlink(json_file)
            os.unlink(parquet_file)

    def test_cache_performance_with_use_cases(self, sample_steam_api_response):
        """Test cache performance when used by multiple concurrent use cases."""
        import threading
        import time

        # Large catalog for performance testing
        large_catalog = {f"Game {i}": i + 50000 for i in range(1000)}

        repository = InMemoryCatalogRepository(large_catalog)
        api_client = MockSteamApiClient(sample_steam_api_response)

        cache = SteamCatalogCache(
            repository,
            api_client,
            max_cache_size=500,  # Force some eviction
            optimization_enabled=True,
        )

        results = []
        errors = []

        def use_case_worker(worker_id):
            """Simulate concurrent use case operations."""
            try:
                use_case = GameLookupUseCase(cache)

                start_time = time.time()

                # Each worker looks up 50 games
                for i in range(50):
                    game_name = f"Game {(worker_id * 50 + i) % 1000}"
                    app_id = use_case.find_app_id_for_game(game_name)
                    assert app_id.value > 0

                end_time = time.time()
                results.append((worker_id, end_time - start_time))

            except Exception as e:
                errors.append((worker_id, str(e)))

        # Start 10 concurrent use case workers
        threads = []
        start_time = time.time()

        for worker_id in range(10):
            thread = threading.Thread(target=use_case_worker, args=(worker_id,))
            threads.append(thread)
            thread.start()

        # Wait for all workers to complete
        for thread in threads:
            thread.join()

        total_time = time.time() - start_time

        # Verify performance and correctness
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == 10  # All workers completed
        assert total_time < 5.0  # Reasonable total time

        # Individual worker times should be reasonable
        for worker_id, worker_time in results:
            assert worker_time < 2.0, f"Worker {worker_id} took {worker_time:.2f}s"

        # Cache statistics should show good performance
        stats = cache.get_statistics()
        assert stats["hit_rate"] > 0.8  # Good cache hit rate

    def test_cache_failure_handling_in_use_cases(self):
        """Test how use cases handle cache failures gracefully."""
        # Setup cache that will fail
        failing_repository = Mock()
        failing_repository.load_catalog.side_effect = Exception("Repository failed")

        failing_api_client = Mock()
        failing_api_client.fetch_app_list.side_effect = Exception("API failed")

        cache = SteamCatalogCache(failing_repository, failing_api_client, graceful_degradation=True)

        # Use case should handle cache failures gracefully
        resilient_use_case = ResilientGameLookupUseCase(cache)

        # Should not crash, but return appropriate defaults
        app_id = resilient_use_case.find_app_id_with_fallback("Any Game")
        assert app_id == SteamAppId(0)  # Default for not found

        # Use case should be able to report the issue
        status = resilient_use_case.get_service_status()
        assert status["cache_available"] is False
        assert status["last_error"] is not None


# Use case implementations that demonstrate cache abstraction
class GameEnrichmentUseCase:
    """Use case for enriching game data with app IDs."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def enrich_games_with_app_ids(self, games_df: pd.DataFrame) -> pd.DataFrame:
        enriched_df = games_df.copy()

        for index, row in enriched_df.iterrows():
            if row["app_id"] == 0:  # Needs enrichment
                app_id = self._cache.get_app_id(row["name"])
                enriched_df.at[index, "app_id"] = app_id.value
                enriched_df.at[index, "found_game_name"] = row["name"]

        return enriched_df


class GameDiscoveryUseCase:
    """Use case for discovering new games."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def discover_games_by_search_terms(self, search_terms: List[str]) -> List["DiscoveredGame"]:
        discovered = []

        for term in search_terms:
            # Cache handles whether to use local data or API
            matching_games = self._cache.search_games_by_term(term)
            discovered.extend(matching_games)

        return discovered


class GameRecommendationUseCase:
    """Use case for game recommendations."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def get_highly_rated_games(self, game_names: List[str], min_rating: float) -> List["GameRecommendation"]:
        recommendations = []

        for game_name in game_names:
            app_id = self._cache.get_app_id(game_name)
            if app_id.value > 0:
                rating = self._cache.get_game_rating(app_id)
                if rating and rating.score >= min_rating:
                    recommendations.append(GameRecommendation(name=GameName(game_name), app_id=app_id, rating=rating))

        return recommendations


class GameLibraryManagementUseCase:
    """Use case for managing game library."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def add_game_to_library(self, game_name: str, app_id: int):
        self._cache.update_app_id(game_name, app_id)

    def update_game_app_id(self, game_name: str, new_app_id: int):
        self._cache.update_app_id(game_name, new_app_id)

    def remove_game_from_library(self, game_name: str):
        self._cache.remove_game(game_name)


class UnifiedGameLookupUseCase:
    """Use case that works with unified cache regardless of underlying sources."""

    def __init__(self, cache):
        self._cache = cache

    def lookup_games(self, game_names: List[str]) -> Dict[str, SteamAppId]:
        results = {}
        for game_name in game_names:
            app_id = self._cache.get_app_id(game_name)
            results[game_name] = app_id
        return results


class GameLookupUseCase:
    """Simple game lookup use case."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def find_app_id_for_game(self, game_name: str) -> SteamAppId:
        return self._cache.get_app_id(game_name)


class ResilientGameLookupUseCase:
    """Use case that handles cache failures gracefully."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache
        self._last_error = None

    def find_app_id_with_fallback(self, game_name: str) -> SteamAppId:
        try:
            return self._cache.get_app_id(game_name)
        except Exception as e:
            self._last_error = str(e)
            return SteamAppId(0)  # Default fallback

    def get_service_status(self) -> Dict[str, any]:
        return {"cache_available": self._cache.is_available(), "last_error": self._last_error}


# Value objects for discovered games and recommendations
class DiscoveredGame:
    """Value object for discovered games."""

    def __init__(self, name: "GameName", app_id: SteamAppId):
        self.name = name
        self.app_id = app_id


class GameRecommendation:
    """Value object for game recommendations."""

    def __init__(self, name: "GameName", app_id: SteamAppId, rating: "GameRating"):
        self.name = name
        self.app_id = app_id
        self.rating = rating


class MultiSourceSteamCatalogCache:
    """Cache that aggregates multiple repository sources."""

    pass
