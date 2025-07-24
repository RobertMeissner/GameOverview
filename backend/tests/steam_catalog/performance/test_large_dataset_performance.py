"""
Performance tests for Steam catalog hexagonal architecture with large datasets.
Tests system behavior under realistic production loads.
"""

import time
import pytest
import pandas as pd
import json
import tempfile
import os
from unittest.mock import patch, Mock
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed


class TestLargeDatasetPerformance:
    """Performance tests with large game datasets."""

    def test_catalog_loading_performance(self):
        """Test catalog loading performance with large JSON files."""
        # Create large catalog (10,000 games)
        large_catalog = {f"Game {i}": i + 100000 for i in range(10000)}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(large_catalog, f, indent=2)
            catalog_file = f.name

        try:
            repository = JsonCatalogRepository(catalog_file)

            # Measure loading time
            start_time = time.time()
            catalog = repository.load_catalog()
            load_time = time.time() - start_time

            # Performance assertions
            assert load_time < 2.0, f"Loading took {load_time:.2f}s, expected < 2.0s"
            assert len(catalog) == 10000
            assert catalog["Game 5000"] == 105000

        finally:
            os.unlink(catalog_file)

    def test_catalog_saving_performance(self):
        """Test catalog saving performance with large datasets."""
        large_catalog = {f"Game {i}": i + 100000 for i in range(10000)}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name

        try:
            repository = JsonCatalogRepository(catalog_file)

            # Measure saving time
            start_time = time.time()
            repository.save_catalog(large_catalog)
            save_time = time.time() - start_time

            # Performance assertions
            assert save_time < 3.0, f"Saving took {save_time:.2f}s, expected < 3.0s"

            # Verify data integrity
            loaded_catalog = repository.load_catalog()
            assert loaded_catalog == large_catalog

        finally:
            os.unlink(catalog_file)

    def test_dataframe_enrichment_performance(self, sample_catalog_dict):
        """Test DataFrame enrichment performance with large datasets."""
        # Create large DataFrame (5,000 games)
        large_df = pd.DataFrame(
            [
                {
                    "name": f"Game {i}",
                    "app_id": 0,
                    "store": "steam",
                    "played": False,
                    "rating": None,
                    "corrected_app_id": 0,
                    "found_game_name": "",
                }
                for i in range(5000)
            ]
        )

        # Create catalog with subset of games (every 10th game has an app_id)
        test_catalog = sample_catalog_dict.copy()
        for i in range(0, 5000, 10):
            test_catalog[f"Game {i}"] = i + 200000

        repository = InMemoryCatalogRepository(test_catalog)
        catalog_service = SteamCatalogService(repository, None)
        enrichment_service = GameDataEnrichmentService(catalog_service, None)

        # Measure enrichment time
        start_time = time.time()
        enriched_df = enrichment_service.enrich_with_app_ids(large_df)
        enrichment_time = time.time() - start_time

        # Performance assertions
        assert enrichment_time < 10.0, f"Enrichment took {enrichment_time:.2f}s, expected < 10.0s"

        # Verify correctness
        matched_games = enriched_df[enriched_df["app_id"] > 0]
        assert len(matched_games) == 500  # Every 10th game should match

        # Check specific matches
        game_0_row = enriched_df[enriched_df["name"] == "Game 0"].iloc[0]
        assert game_0_row["app_id"] == 200000

    def test_concurrent_catalog_access(self, sample_catalog_dict):
        """Test concurrent access to catalog from multiple threads."""
        repository = InMemoryCatalogRepository(sample_catalog_dict)
        catalog_service = SteamCatalogService(repository, None)

        results = []
        errors = []

        def worker_task(worker_id, num_operations=100):
            """Worker function for concurrent testing."""
            worker_results = []
            try:
                for i in range(num_operations):
                    # Mix of read operations
                    app_id = catalog_service.get_app_id_by_name("Half-Life 2")
                    worker_results.append((worker_id, i, app_id.value))

                    # Occasional write operations
                    if i % 20 == 0:
                        catalog_service.update_game_app_id(f"Worker{worker_id}_Game{i}", worker_id * 1000 + i)

                results.extend(worker_results)
            except Exception as e:
                errors.append((worker_id, str(e)))

        # Start multiple concurrent threads
        num_workers = 10
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            start_time = time.time()

            futures = [executor.submit(worker_task, worker_id, 100) for worker_id in range(num_workers)]

            # Wait for all tasks to complete
            for future in as_completed(futures):
                future.result()  # This will raise any exceptions

            total_time = time.time() - start_time

        # Performance assertions
        assert total_time < 5.0, f"Concurrent access took {total_time:.2f}s, expected < 5.0s"
        assert len(errors) == 0, f"Errors occurred: {errors}"
        assert len(results) == num_workers * 100  # All read operations completed

        # Verify data consistency
        assert all(result[2] == 220 for result in results)  # All reads returned Half-Life 2 app_id

    def test_memory_usage_with_large_catalogs(self):
        """Test memory usage doesn't grow excessively with large catalogs."""
        import psutil
        import gc

        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Create and process multiple large catalogs
        for iteration in range(5):
            large_catalog = {f"Iteration{iteration}_Game{i}": i + iteration * 100000 for i in range(5000)}

            repository = InMemoryCatalogRepository(large_catalog)
            catalog_service = SteamCatalogService(repository, None)

            # Perform operations
            for i in range(100):
                app_id = catalog_service.get_app_id_by_name(f"Iteration{iteration}_Game{i}")
                catalog_service.update_game_app_id(f"TempGame{i}", i)

            # Clear references
            del repository, catalog_service, large_catalog
            gc.collect()

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_growth = final_memory - initial_memory

        # Memory growth should be reasonable (< 100MB for this test)
        assert memory_growth < 100, f"Memory grew by {memory_growth:.1f}MB, expected < 100MB"

    def test_api_client_with_rate_limiting(self):
        """Test API client performance with simulated rate limiting."""
        api_responses = []
        call_times = []

        def mock_request_with_delay(*args, **kwargs):
            call_times.append(time.time())
            time.sleep(0.1)  # Simulate API response time

            # Simulate rate limiting every 10th call
            if len(call_times) % 10 == 0:
                time.sleep(1.0)  # Rate limit delay

            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"success": 1, "query_summary": {"total_reviews": 100}}
            mock_response.raise_for_status.return_value = None
            return mock_response

        with patch("requests.get", side_effect=mock_request_with_delay):
            client = HttpSteamApiClient("https://api.steampowered.com", timeout=30)
            rating_service = GameRatingService(client)

            app_ids = [SteamAppId(i) for i in range(50)]

            start_time = time.time()
            ratings = rating_service.get_batch_ratings(app_ids)
            total_time = time.time() - start_time

            # Should complete within reasonable time despite rate limiting
            assert total_time < 15.0, f"Batch rating took {total_time:.2f}s, expected < 15.0s"
            assert len(ratings) == 50

            # Verify rate limiting was handled (some delays should be longer)
            assert len(call_times) == 50

    def test_catalog_search_performance(self, sample_catalog_dict):
        """Test catalog search performance with large datasets."""
        # Create large catalog with realistic game names
        large_catalog = sample_catalog_dict.copy()

        # Add many more games with variations
        for i in range(1000):
            large_catalog[f"Game Series {i}"] = i + 300000
            large_catalog[f"Adventure Quest {i}"] = i + 400000
            large_catalog[f"Racing Championship {i}"] = i + 500000

        repository = InMemoryCatalogRepository(large_catalog)
        catalog_service = SteamCatalogService(repository, None)

        # Test exact matches
        start_time = time.time()
        for i in range(100):
            app_id = catalog_service.get_app_id_by_name(f"Game Series {i}")
            assert app_id.value == i + 300000
        exact_match_time = time.time() - start_time

        # Test fuzzy matches (with demo removal)
        start_time = time.time()
        for i in range(50):
            app_id = catalog_service.get_app_id_by_name(f"Game Series {i} Demo")
            assert app_id.value == i + 300000
        fuzzy_match_time = time.time() - start_time

        # Performance assertions
        assert exact_match_time < 1.0, f"Exact matching took {exact_match_time:.2f}s, expected < 1.0s"
        assert fuzzy_match_time < 2.0, f"Fuzzy matching took {fuzzy_match_time:.2f}s, expected < 2.0s"

    @pytest.mark.slow
    def test_end_to_end_performance_benchmark(self):
        """Comprehensive end-to-end performance benchmark."""
        # This test simulates a realistic production scenario

        # Setup: Large catalog and game dataset
        catalog_size = 20000
        dataset_size = 2000

        large_catalog = {f"Benchmark Game {i}": i + 600000 for i in range(catalog_size)}

        game_dataset = pd.DataFrame(
            [
                {
                    "name": f"Benchmark Game {i}" if i % 3 == 0 else f"Unknown Game {i}",
                    "app_id": 0,
                    "store": "steam",
                    "played": i % 4 != 0,  # 75% played, 25% unplayed
                    "rating": None,
                    "corrected_app_id": 0,
                    "found_game_name": "",
                }
                for i in range(dataset_size)
            ]
        )

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(large_catalog, f)
            catalog_file = f.name

        try:
            # Performance benchmark
            config = {"catalog_file_path": catalog_file}
            factory = SteamCatalogFactory()
            system = factory.create_complete_system(config)

            benchmark_results = {}

            # 1. Catalog loading
            start_time = time.time()
            catalog = system.catalog_service._repository.load_catalog()
            benchmark_results["catalog_loading"] = time.time() - start_time

            # 2. App ID enrichment
            start_time = time.time()
            enriched_df = system.enrichment_service.enrich_with_app_ids(game_dataset.copy())
            benchmark_results["app_id_enrichment"] = time.time() - start_time

            # 3. Game filtering
            start_time = time.time()
            unplayed_games = system.enrichment_service.get_unplayed_games(enriched_df)
            benchmark_results["game_filtering"] = time.time() - start_time

            # 4. Statistics calculation
            start_time = time.time()
            stats = system.catalog_service.get_catalog_statistics()
            benchmark_results["statistics"] = time.time() - start_time

            # Performance assertions
            assert benchmark_results["catalog_loading"] < 5.0
            assert benchmark_results["app_id_enrichment"] < 8.0
            assert benchmark_results["game_filtering"] < 1.0
            assert benchmark_results["statistics"] < 1.0

            total_time = sum(benchmark_results.values())
            assert total_time < 15.0, f"Total benchmark time: {total_time:.2f}s"

            # Verify correctness
            matched_games = enriched_df[enriched_df["app_id"] > 0]
            expected_matches = dataset_size // 3  # Every 3rd game should match
            assert len(matched_games) == expected_matches

            print(f"\nPerformance Benchmark Results:")
            print(f"Catalog size: {catalog_size:,} games")
            print(f"Dataset size: {dataset_size:,} games")
            for operation, duration in benchmark_results.items():
                print(f"{operation}: {duration:.3f}s")
            print(f"Total time: {total_time:.3f}s")

        finally:
            os.unlink(catalog_file)


# Import required classes
from ..conftest import InMemoryCatalogRepository, MockSteamApiClient
from ..unit.test_domain_services import SteamCatalogService, GameRatingService, GameDataEnrichmentService
from ..unit.test_domain_entities import SteamAppId
from ..integration.test_json_catalog_repository import JsonCatalogRepository
from ..integration.test_http_steam_api_client import HttpSteamApiClient
from ..e2e.test_catalog_system import SteamCatalogFactory
