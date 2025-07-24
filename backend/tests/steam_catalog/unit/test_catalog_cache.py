"""
Unit tests for Steam catalog caching and persistence layer.
Tests the cache abstraction that hides JSON/API details from use cases.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from typing import Dict, Optional


class TestSteamCatalogCache:
    """Test cases for SteamCatalogCache that abstracts storage details."""

    def test_get_app_id_from_empty_cache(self, mock_catalog_repository, mock_steam_api_client):
        """Test getting app ID when cache is empty - should populate from repository."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        app_id = cache.get_app_id("Half-Life 2")

        assert app_id == SteamAppId(220)
        assert mock_catalog_repository.load_count == 1
        assert mock_steam_api_client.call_count == 0  # No API call needed

        # Subsequent calls should use cache
        app_id2 = cache.get_app_id("Half-Life 2")
        assert app_id2 == SteamAppId(220)
        assert mock_catalog_repository.load_count == 1  # No additional load

    def test_get_app_id_cache_miss_triggers_api_refresh(self, empty_mock_catalog_repository, mock_steam_api_client):
        """Test that cache miss triggers API refresh when local data is insufficient."""
        cache = SteamCatalogCache(empty_mock_catalog_repository, mock_steam_api_client, auto_refresh_on_miss=True)

        app_id = cache.get_app_id("Half-Life 2")

        # Should have triggered API refresh
        assert mock_steam_api_client.call_count == 1
        assert empty_mock_catalog_repository.save_count == 1
        assert app_id == SteamAppId(220)

    def test_cache_expiration_triggers_refresh(self, mock_catalog_repository, mock_steam_api_client):
        """Test that expired cache triggers refresh from repository."""
        cache = SteamCatalogCache(
            mock_catalog_repository,
            mock_steam_api_client,
            cache_ttl_seconds=1,  # Very short TTL
        )

        # First access
        app_id1 = cache.get_app_id("Half-Life 2")
        assert app_id1 == SteamAppId(220)
        assert mock_catalog_repository.load_count == 1

        # Wait for cache to expire
        import time

        time.sleep(1.1)

        # Second access should reload from repository
        app_id2 = cache.get_app_id("Portal")
        assert app_id2 == SteamAppId(400)
        assert mock_catalog_repository.load_count == 2

    def test_cache_warm_up_from_repository(self, mock_catalog_repository, mock_steam_api_client):
        """Test warming up cache from repository on initialization."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client, warm_up_on_init=True)

        # Cache should be pre-loaded
        assert cache.is_warmed_up()
        assert cache.get_cached_entry_count() == 10  # From sample_catalog_dict

        # Getting app ID should not trigger additional loads
        app_id = cache.get_app_id("Half-Life 2")
        assert app_id == SteamAppId(220)
        assert mock_catalog_repository.load_count == 1  # Only initial warm-up

    def test_cache_update_persists_to_repository(self, mock_catalog_repository, mock_steam_api_client):
        """Test that cache updates are persisted to repository."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        # Update cache with new entry
        cache.update_app_id("New Game", 99999)

        # Should be immediately available in cache
        app_id = cache.get_app_id("New Game")
        assert app_id == SteamAppId(99999)

        # Should be persisted to repository
        assert mock_catalog_repository.save_count == 1
        saved_catalog = mock_catalog_repository.catalog
        assert saved_catalog["New Game"] == 99999

    def test_batch_cache_operations(self, mock_catalog_repository, mock_steam_api_client):
        """Test batch operations for efficient cache management."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        # Batch get operations
        game_names = ["Half-Life 2", "Portal", "Team Fortress 2", "Unknown Game"]
        app_ids = cache.get_app_ids_batch(game_names)

        expected = {
            "Half-Life 2": SteamAppId(220),
            "Portal": SteamAppId(400),
            "Team Fortress 2": SteamAppId(440),
            "Unknown Game": SteamAppId(0),  # Not found
        }
        assert app_ids == expected
        assert mock_catalog_repository.load_count == 1  # Single load for all

    def test_cache_statistics(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache statistics and performance metrics."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        # Generate some cache activity
        cache.get_app_id("Half-Life 2")  # Hit
        cache.get_app_id("Portal")  # Hit
        cache.get_app_id("Unknown")  # Miss
        cache.get_app_id("Half-Life 2")  # Hit (cached)

        stats = cache.get_statistics()

        expected_stats = {
            "cache_hits": 3,
            "cache_misses": 1,
            "hit_rate": 0.75,
            "total_entries": 10,
            "last_refresh": stats["last_refresh"],  # Dynamic
            "repository_loads": 1,
            "api_calls": 0,
        }

        assert stats == expected_stats

    def test_cache_invalidation(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache invalidation and refresh mechanisms."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        # Load initial data
        app_id1 = cache.get_app_id("Half-Life 2")
        assert app_id1 == SteamAppId(220)

        # Update repository externally (simulate external change)
        mock_catalog_repository.catalog["Half-Life 2"] = 999

        # Cache should still return old value
        app_id2 = cache.get_app_id("Half-Life 2")
        assert app_id2 == SteamAppId(220)  # Still cached

        # Invalidate cache
        cache.invalidate()

        # Should now return updated value
        app_id3 = cache.get_app_id("Half-Life 2")
        assert app_id3 == SteamAppId(999)  # Updated value
        assert mock_catalog_repository.load_count == 2

    def test_cache_with_fallback_strategies(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache fallback strategies when data sources fail."""
        # Make repository fail
        mock_catalog_repository.load_catalog = Mock(side_effect=RepositoryError("Load failed"))

        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client, fallback_to_api=True)

        # Should fallback to API when repository fails
        app_id = cache.get_app_id("Half-Life 2")

        assert app_id == SteamAppId(220)
        assert mock_steam_api_client.call_count == 1  # API was called as fallback

    def test_cache_size_limits_and_eviction(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache size limits and LRU eviction."""
        cache = SteamCatalogCache(
            mock_catalog_repository,
            mock_steam_api_client,
            max_cache_size=3,  # Very small cache
        )

        # Fill cache beyond limit
        cache.get_app_id("Half-Life 2")  # 1
        cache.get_app_id("Portal")  # 2
        cache.get_app_id("Team Fortress 2")  # 3
        cache.get_app_id("Dota 2")  # 4 - should evict oldest

        # Verify cache size is maintained
        assert cache.get_cached_entry_count() <= 3

        # Verify LRU eviction (Half-Life 2 should be evicted)
        stats = cache.get_statistics()
        cache.get_app_id("Half-Life 2")  # Should be a miss now

        new_stats = cache.get_statistics()
        assert new_stats["cache_misses"] > stats["cache_misses"]


class TestCacheConfiguration:
    """Test cases for cache configuration and behavior customization."""

    def test_cache_with_different_refresh_strategies(self, mock_catalog_repository, mock_steam_api_client):
        """Test different cache refresh strategies."""
        # Lazy refresh (default)
        lazy_cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client, refresh_strategy=CacheRefreshStrategy.LAZY)

        # Eager refresh
        eager_cache = SteamCatalogCache(
            mock_catalog_repository, mock_steam_api_client, refresh_strategy=CacheRefreshStrategy.EAGER, eager_refresh_interval_seconds=60
        )

        # Background refresh
        background_cache = SteamCatalogCache(
            mock_catalog_repository,
            mock_steam_api_client,
            refresh_strategy=CacheRefreshStrategy.BACKGROUND,
            background_refresh_interval_seconds=300,
        )

        # Test that each cache type behaves differently
        assert lazy_cache._refresh_strategy == CacheRefreshStrategy.LAZY
        assert eager_cache._refresh_strategy == CacheRefreshStrategy.EAGER
        assert background_cache._refresh_strategy == CacheRefreshStrategy.BACKGROUND

    def test_cache_with_custom_key_generation(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache with custom key generation for game names."""

        def custom_key_generator(game_name: str) -> str:
            # Normalize case and remove special characters
            return game_name.lower().replace(" ", "_").replace("-", "_")

        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client, key_generator=custom_key_generator)

        # Different case should resolve to same entry
        app_id1 = cache.get_app_id("Half-Life 2")
        app_id2 = cache.get_app_id("half-life 2")
        app_id3 = cache.get_app_id("HALF-LIFE 2")

        assert app_id1 == app_id2 == app_id3 == SteamAppId(220)

        # Should have only made one repository call due to key normalization
        stats = cache.get_statistics()
        assert stats["cache_hits"] == 2  # Last two were cache hits

    def test_cache_with_persistence_layers(self, mock_catalog_repository, mock_steam_api_client):
        """Test cache with multiple persistence layers (L1: memory, L2: file, L3: API)."""
        cache = MultiLayerSteamCatalogCache(
            layers=[InMemoryCacheLayer(max_size=100), FileCacheLayer(mock_catalog_repository), ApiCacheLayer(mock_steam_api_client)]
        )

        # First access should go through all layers
        app_id = cache.get_app_id("Half-Life 2")
        assert app_id == SteamAppId(220)

        # Second access should hit L1 (memory)
        app_id2 = cache.get_app_id("Half-Life 2")
        assert app_id2 == SteamAppId(220)

        # Verify layer statistics
        layer_stats = cache.get_layer_statistics()
        assert layer_stats["L1"]["hits"] == 1
        assert layer_stats["L2"]["hits"] == 1
        assert layer_stats["L3"]["hits"] == 1


class TestCacheIntegrationWithUseCases:
    """Test cache integration with domain use cases."""

    def test_use_case_only_sees_cache_interface(self, mock_catalog_repository, mock_steam_api_client):
        """Test that use cases only interact with cache, not underlying storage."""
        cache = SteamCatalogCache(mock_catalog_repository, mock_steam_api_client)

        # Use case should only see the cache interface
        game_lookup_use_case = GameLookupUseCase(cache)  # Not repository or API client

        # Use case operations
        app_id = game_lookup_use_case.find_app_id_for_game("Half-Life 2")
        assert app_id == SteamAppId(220)

        # Use case shouldn't know about underlying storage
        assert not hasattr(game_lookup_use_case, "_repository")
        assert not hasattr(game_lookup_use_case, "_api_client")
        assert hasattr(game_lookup_use_case, "_cache")

    def test_cache_provides_consistent_interface_regardless_of_source(self, mock_steam_api_client):
        """Test that cache provides same interface whether data comes from JSON or API."""
        # Cache with repository (JSON source)
        json_repository = MockCatalogRepository({"Game A": 1000})
        json_cache = SteamCatalogCache(json_repository, mock_steam_api_client)

        # Cache with API-only (no local storage)
        empty_repository = MockCatalogRepository({})
        api_cache = SteamCatalogCache(empty_repository, mock_steam_api_client, auto_refresh_on_miss=True)

        # Both should provide identical interface to use cases
        app_id_from_json = json_cache.get_app_id("Game A")
        app_id_from_api = api_cache.get_app_id("Half-Life 2")  # From API response

        # Interface is identical
        assert isinstance(app_id_from_json, SteamAppId)
        assert isinstance(app_id_from_api, SteamAppId)
        assert app_id_from_json.value == 1000
        assert app_id_from_api.value == 220

    def test_cache_abstraction_enables_different_storage_backends(self, mock_steam_api_client):
        """Test that cache abstraction allows different storage backends transparently."""
        # Different storage backends
        json_repository = JsonCatalogRepository("/tmp/test.json")
        memory_repository = InMemoryCatalogRepository({"Test Game": 5000})
        parquet_repository = ParquetCatalogRepository("/tmp/test.parquet")

        # All use same cache interface
        caches = [
            SteamCatalogCache(json_repository, mock_steam_api_client),
            SteamCatalogCache(memory_repository, mock_steam_api_client),
            SteamCatalogCache(parquet_repository, mock_steam_api_client),
        ]

        # Use cases work identically with all backends
        for cache in caches:
            use_case = GameLookupUseCase(cache)

            # Same interface, different storage
            if hasattr(cache._repository, "catalog") and "Test Game" in cache._repository.catalog:
                app_id = use_case.find_app_id_for_game("Test Game")
                assert app_id == SteamAppId(5000)


# Cache implementation interfaces that would be created
class SteamCatalogCache:
    """Main cache abstraction for Steam catalog data."""

    pass


class MultiLayerSteamCatalogCache:
    """Multi-layer cache with different storage tiers."""

    pass


class CacheRefreshStrategy:
    """Enumeration of cache refresh strategies."""

    LAZY = "lazy"
    EAGER = "eager"
    BACKGROUND = "background"


class InMemoryCacheLayer:
    """In-memory cache layer (L1)."""

    pass


class FileCacheLayer:
    """File-based cache layer (L2)."""

    pass


class ApiCacheLayer:
    """API-based cache layer (L3)."""

    pass


class GameLookupUseCase:
    """Example use case that only sees cache interface."""

    def __init__(self, cache: SteamCatalogCache):
        self._cache = cache

    def find_app_id_for_game(self, game_name: str) -> SteamAppId:
        return self._cache.get_app_id(game_name)


# Import required classes and exceptions
from ..conftest import MockCatalogRepository, InMemoryCatalogRepository
from ..unit.test_domain_entities import SteamAppId
from ..integration.test_json_catalog_repository import JsonCatalogRepository, ParquetCatalogRepository, RepositoryError
