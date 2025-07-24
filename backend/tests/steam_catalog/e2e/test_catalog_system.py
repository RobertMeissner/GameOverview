"""
End-to-end tests for the complete Steam catalog system.
Tests the full integration of all layers working together.
"""

import json
import os
import tempfile
import pytest
import pandas as pd
from unittest.mock import patch, Mock
from typing import Dict, Any


class TestSteamCatalogSystemIntegration:
    """End-to-end tests for the complete Steam catalog system."""

    def test_complete_catalog_workflow(self, steam_config, sample_steam_api_response, sample_steam_rating_response):
        """Test complete workflow from catalog refresh to game rating."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name

        try:
            # Update config to use temp file
            steam_config["catalog_file_path"] = catalog_file

            # Create system with real dependencies
            factory = SteamCatalogFactory()
            system = factory.create_complete_system(steam_config)

            # Mock HTTP responses
            with patch("requests.get") as mock_get:
                # Mock app list response
                mock_app_response = Mock()
                mock_app_response.status_code = 200
                mock_app_response.json.return_value = sample_steam_api_response
                mock_app_response.raise_for_status.return_value = None

                # Mock rating response
                mock_rating_response = Mock()
                mock_rating_response.status_code = 200
                mock_rating_response.json.return_value = sample_steam_rating_response
                mock_rating_response.raise_for_status.return_value = None

                mock_get.side_effect = [mock_app_response, mock_rating_response]

                # Step 1: Refresh catalog
                system.catalog_service.refresh_catalog()

                # Verify catalog was saved to file
                assert os.path.exists(catalog_file)
                with open(catalog_file, "r") as f:
                    saved_catalog = json.load(f)
                assert "Half-Life 2" in saved_catalog
                assert saved_catalog["Half-Life 2"] == 220

                # Step 2: Look up game by name
                app_id = system.catalog_service.get_app_id_by_name("Half-Life 2")
                assert app_id.value == 220

                # Step 3: Get game rating
                rating = system.rating_service.get_game_rating(app_id)
                assert rating is not None
                assert rating.app_id == app_id
                assert rating.total_reviews == 150000

                # Verify HTTP calls were made
                assert mock_get.call_count == 2

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_game_data_enrichment_pipeline(self, steam_config, sample_game_data, sample_steam_api_response, sample_steam_rating_response):
        """Test complete pipeline for enriching game data with catalog and ratings."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name
            # Pre-populate catalog
            catalog_dict = {app["name"]: app["appid"] for app in sample_steam_api_response["applist"]["apps"]}
            json.dump(catalog_dict, f, indent=2)

        try:
            steam_config["catalog_file_path"] = catalog_file

            factory = SteamCatalogFactory()
            enrichment_service = factory.create_enrichment_service(steam_config)

            with patch("requests.get") as mock_get:
                # Mock rating responses
                mock_rating_response = Mock()
                mock_rating_response.status_code = 200
                mock_rating_response.json.return_value = sample_steam_rating_response
                mock_rating_response.raise_for_status.return_value = None
                mock_get.return_value = mock_rating_response

                # Step 1: Enrich with app IDs
                enriched_with_ids = enrichment_service.enrich_with_app_ids(sample_game_data.copy())

                # Verify app IDs were filled
                hl2_row = enriched_with_ids[enriched_with_ids["name"] == "Half-Life 2"].iloc[0]
                assert hl2_row["app_id"] == 220
                assert hl2_row["found_game_name"] == "Half-Life 2"

                # Step 2: Enrich with ratings
                final_enriched = enrichment_service.enrich_with_ratings(enriched_with_ids)

                # Verify ratings were added
                rated_games = final_enriched[final_enriched["app_id"] > 0]
                assert len(rated_games) > 0
                assert all(rated_games["rating"].notna())

                # Step 3: Filter for highly rated unplayed games
                unplayed_highly_rated = enrichment_service.get_top_unplayed_games(final_enriched, min_rating=0.8, limit=5)

                assert len(unplayed_highly_rated) <= 5
                assert all(unplayed_highly_rated["played"] == False)
                assert all(unplayed_highly_rated["rating"] >= 0.8)

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_catalog_persistence_across_sessions(self, steam_config, sample_steam_api_response):
        """Test that catalog persists across different system instances."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name

        try:
            steam_config["catalog_file_path"] = catalog_file
            factory = SteamCatalogFactory()

            # Session 1: Create and populate catalog
            with patch("requests.get") as mock_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = sample_steam_api_response
                mock_response.raise_for_status.return_value = None
                mock_get.return_value = mock_response

                system1 = factory.create_catalog_service(steam_config)
                system1.refresh_catalog()

                # Verify catalog exists
                app_id = system1.get_app_id_by_name("Half-Life 2")
                assert app_id.value == 220

            # Session 2: Create new instance, should load existing catalog
            system2 = factory.create_catalog_service(steam_config)

            # Should find game without API call
            app_id = system2.get_app_id_by_name("Portal")
            assert app_id.value == 400

            # Verify file contains expected data
            with open(catalog_file, "r") as f:
                saved_catalog = json.load(f)
            assert len(saved_catalog) == 10  # All games from sample response
            assert "Team Fortress 2" in saved_catalog

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_error_handling_and_recovery(self, steam_config):
        """Test system behavior under various error conditions."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name

        try:
            steam_config["catalog_file_path"] = catalog_file
            factory = SteamCatalogFactory()
            system = factory.create_complete_system(steam_config)

            # Test 1: API failure during refresh
            with patch("requests.get") as mock_get:
                mock_get.side_effect = requests.RequestException("Network error")

                with pytest.raises(CatalogRefreshError):
                    system.catalog_service.refresh_catalog()

                # Catalog should remain empty
                catalog = system.catalog_service._repository.load_catalog()
                assert len(catalog) == 0

            # Test 2: Partial API success (some games found, some not)
            test_data = pd.DataFrame(
                [
                    {"name": "Existing Game", "app_id": 0, "store": "steam", "played": False},
                    {"name": "Non-existent Game", "app_id": 0, "store": "steam", "played": False},
                ]
            )

            # Pre-populate catalog with one game
            partial_catalog = {"Existing Game": 12345}
            system.catalog_service._repository.save_catalog(partial_catalog)

            enriched = system.enrichment_service.enrich_with_app_ids(test_data)

            # Existing game should get app_id, non-existent should remain 0
            existing_row = enriched[enriched["name"] == "Existing Game"].iloc[0]
            nonexistent_row = enriched[enriched["name"] == "Non-existent Game"].iloc[0]

            assert existing_row["app_id"] == 12345
            assert nonexistent_row["app_id"] == 0

            # Test 3: Rating API failure should not crash enrichment
            with patch("requests.get") as mock_get:
                mock_get.side_effect = requests.RequestException("Rating API error")

                # Should handle gracefully and continue processing
                try:
                    system.enrichment_service.enrich_with_ratings(enriched)
                except Exception as e:
                    # Should log error but not crash
                    assert "Rating API error" in str(e)

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_performance_with_large_dataset(self, steam_config):
        """Test system performance with large game datasets."""
        # Create large dataset
        large_dataset = pd.DataFrame(
            [{"name": f"Game {i}", "app_id": 0, "store": "steam", "played": False, "rating": None} for i in range(1000)]
        )

        # Create catalog with subset of games
        test_catalog = {f"Game {i}": i + 1000 for i in range(0, 1000, 10)}  # Every 10th game

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name
            json.dump(test_catalog, f, indent=2)

        try:
            steam_config["catalog_file_path"] = catalog_file
            factory = SteamCatalogFactory()
            enrichment_service = factory.create_enrichment_service(steam_config)

            import time

            start_time = time.time()

            # Enrich large dataset
            enriched = enrichment_service.enrich_with_app_ids(large_dataset)

            end_time = time.time()
            processing_time = end_time - start_time

            # Verify performance (should complete within reasonable time)
            assert processing_time < 5.0  # Less than 5 seconds for 1000 games

            # Verify correctness
            matched_games = enriched[enriched["app_id"] > 0]
            assert len(matched_games) == 100  # Every 10th game should match

            # Verify specific matches
            game_0_row = enriched[enriched["name"] == "Game 0"].iloc[0]
            assert game_0_row["app_id"] == 1000
            assert game_0_row["found_game_name"] == "Game 0"

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_concurrent_access_safety(self, steam_config, sample_steam_api_response):
        """Test system behavior under concurrent access."""
        import threading
        import time

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name

        try:
            steam_config["catalog_file_path"] = catalog_file
            factory = SteamCatalogFactory()

            results = []
            errors = []

            def worker(worker_id):
                try:
                    system = factory.create_catalog_service(steam_config)

                    # Simulate concurrent operations
                    for i in range(10):
                        app_id = system.get_app_id_by_name("Half-Life 2")
                        results.append((worker_id, i, app_id.value))
                        time.sleep(0.01)
                except Exception as e:
                    errors.append((worker_id, str(e)))

            # Pre-populate catalog
            with patch("requests.get") as mock_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = sample_steam_api_response
                mock_response.raise_for_status.return_value = None
                mock_get.return_value = mock_response

                initial_system = factory.create_catalog_service(steam_config)
                initial_system.refresh_catalog()

            # Start multiple worker threads
            threads = []
            for worker_id in range(5):
                thread = threading.Thread(target=worker, args=(worker_id,))
                threads.append(thread)
                thread.start()

            # Wait for all threads to complete
            for thread in threads:
                thread.join()

            # Verify no errors occurred
            assert len(errors) == 0, f"Errors occurred: {errors}"

            # Verify all operations completed successfully
            assert len(results) == 50  # 5 workers * 10 operations

            # Verify all results are consistent
            expected_app_id = 220  # Half-Life 2
            assert all(result[2] == expected_app_id for result in results)

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_integration_with_existing_codebase(self, sample_game_data, steam_config):
        """Test integration with existing request_rating.py functionality."""
        # This test verifies that the hexagonal architecture can replace
        # the existing load_catalog() and related functions

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name
            # Create catalog in existing format
            existing_catalog = {"Half-Life 2": 220, "Portal": 400, "Team Fortress 2": 440}
            json.dump(existing_catalog, f, indent=2)

        try:
            steam_config["catalog_file_path"] = catalog_file
            factory = SteamCatalogFactory()
            system = factory.create_complete_system(steam_config)

            # Test compatibility with existing pandas DataFrame processing
            df = sample_game_data.copy()

            # Apply existing column constants
            APP_ID = "app_id"
            game_name = "name"
            found_game_name = "found_game_name"

            # Simulate existing update_app_id_and_name function behavior
            def update_row_with_catalog(row):
                name = row[game_name]
                app_id = system.catalog_service.get_app_id_by_name(name)
                row[APP_ID] = app_id.value
                row[found_game_name] = name
                return row

            # Apply to games with unknown app_id
            df.loc[df[APP_ID] == 0] = df.loc[df[APP_ID] == 0].apply(update_row_with_catalog, axis=1)

            # Verify results match existing behavior
            hl2_row = df[df[game_name] == "Half-Life 2"].iloc[0]
            assert hl2_row[APP_ID] == 220
            assert hl2_row[found_game_name] == "Half-Life 2"

            unknown_row = df[df[game_name] == "Unknown Game"].iloc[0]
            assert unknown_row[APP_ID] == 0  # Not in catalog

            portal_row = df[df[game_name] == "Portal"].iloc[0]
            assert portal_row[APP_ID] == 400  # Already had app_id, unchanged

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)


class TestSteamCatalogFactory:
    """Test cases for the Steam catalog factory/dependency injection."""

    def test_create_catalog_service(self, steam_config):
        """Test factory creates catalog service with correct dependencies."""
        factory = SteamCatalogFactory()

        service = factory.create_catalog_service(steam_config)

        assert service is not None
        assert hasattr(service, "get_app_id_by_name")
        assert hasattr(service, "refresh_catalog")

    def test_create_rating_service(self, steam_config):
        """Test factory creates rating service with correct dependencies."""
        factory = SteamCatalogFactory()

        service = factory.create_rating_service(steam_config)

        assert service is not None
        assert hasattr(service, "get_game_rating")
        assert hasattr(service, "get_batch_ratings")

    def test_create_enrichment_service(self, steam_config):
        """Test factory creates enrichment service with correct dependencies."""
        factory = SteamCatalogFactory()

        service = factory.create_enrichment_service(steam_config)

        assert service is not None
        assert hasattr(service, "enrich_with_app_ids")
        assert hasattr(service, "enrich_with_ratings")

    def test_create_complete_system(self, steam_config):
        """Test factory creates complete system with all services."""
        factory = SteamCatalogFactory()

        system = factory.create_complete_system(steam_config)

        assert hasattr(system, "catalog_service")
        assert hasattr(system, "rating_service")
        assert hasattr(system, "enrichment_service")

        # Verify services are properly connected
        assert system.enrichment_service._catalog_service is system.catalog_service
        assert system.enrichment_service._rating_service is system.rating_service

    def test_factory_with_custom_dependencies(self, steam_config):
        """Test factory with custom repository and API client implementations."""
        # Create custom implementations
        custom_repository = InMemoryCatalogRepository({"Test Game": 99999})
        custom_api_client = MockSteamApiClient({"applist": {"apps": []}})

        factory = SteamCatalogFactory()

        service = factory.create_catalog_service_with_dependencies(repository=custom_repository, api_client=custom_api_client)

        # Verify custom dependencies are used
        app_id = service.get_app_id_by_name("Test Game")
        assert app_id.value == 99999


# Factory and system classes that would be implemented
class SteamCatalogFactory:
    """Factory for creating Steam catalog system components."""

    pass


class SteamCatalogSystem:
    """Complete Steam catalog system with all services."""

    pass


# Import test fixtures and mocks
from ..conftest import MockSteamApiClient, InMemoryCatalogRepository


# Import domain exceptions
import requests
from ..unit.test_domain_services import CatalogRefreshError
