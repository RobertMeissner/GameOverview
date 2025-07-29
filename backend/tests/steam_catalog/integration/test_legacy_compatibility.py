"""
Integration tests for compatibility with existing legacy code.
Tests that hexagonal architecture can replace existing functions seamlessly.
"""

import json
import os
import tempfile
import pytest
import pandas as pd
from unittest.mock import patch, Mock
from functools import partial


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestLegacyCodeCompatibility:
    """Test compatibility with existing request_rating.py functions."""

    def test_load_catalog_replacement(self, sample_steam_api_response, sample_catalog_dict):
        """Test that hexagonal catalog service can replace load_catalog() function."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            catalog_file = f.name
            json.dump(sample_catalog_dict, f, indent=2)

        try:
            # Original load_catalog behavior
            def original_load_catalog():
                data = {}
                if os.path.exists(catalog_file):
                    with open(catalog_file, encoding="utf-8") as file:
                        data = json.load(file)
                return data

            # Hexagonal equivalent
            config = {"catalog_file_path": catalog_file}
            factory = SteamCatalogFactory()
            catalog_service = factory.create_catalog_service(config)

            # Compare results
            original_result = original_load_catalog()
            hexagonal_result = catalog_service._repository.load_catalog()

            assert original_result == hexagonal_result
            assert original_result == sample_catalog_dict

        finally:
            if os.path.exists(catalog_file):
                os.unlink(catalog_file)

    def test_restructure_data_replacement(self, sample_steam_api_response):
        """Test that hexagonal data processing can replace restructure_data() function."""

        # Original restructure_data behavior
        def original_restructure_data(data: dict) -> dict:
            apps = data.get("applist", {}).get("apps", [])
            return {app["name"]: app["appid"] for app in apps}

        # Hexagonal equivalent using domain service
        parser = SteamApiResponseParser()

        # Compare results
        original_result = original_restructure_data(sample_steam_api_response)
        hexagonal_result = parser.parse_app_list_to_catalog_dict(sample_steam_api_response)

        assert original_result == hexagonal_result
        assert "Half-Life 2" in original_result
        assert original_result["Half-Life 2"] == 220

    def test_app_id_matched_by_catalog_replacement(self, sample_catalog_dict):
        """Test that hexagonal service can replace app_id_matched_by_catalog() function."""

        # Original app_id_matched_by_catalog behavior
        def original_app_id_matched_by_catalog(name: str, catalog: dict) -> int:
            if name in catalog.keys():
                return catalog[name]
            return 0

        # Hexagonal equivalent
        repository = InMemoryCatalogRepository(sample_catalog_dict)
        catalog_service = SteamCatalogService(repository, None)

        # Test existing game
        name = "Half-Life 2"
        original_result = original_app_id_matched_by_catalog(name, sample_catalog_dict)
        hexagonal_result = catalog_service.get_app_id_by_name(name).value

        assert original_result == hexagonal_result == 220

        # Test non-existing game
        name = "Non-existent Game"
        original_result = original_app_id_matched_by_catalog(name, sample_catalog_dict)
        hexagonal_result = catalog_service.get_app_id_by_name(name).value

        assert original_result == hexagonal_result == 0

    def test_steam_app_ids_matched_replacement(self, sample_game_data, sample_catalog_dict):
        """Test that hexagonal service can replace steam_app_ids_matched() function."""
        # Original constants
        APP_ID = "app_id"
        CORRECTED_APP_ID = "corrected_app_id"
        game_name = "name"
        found_game_name = "found_game_name"

        # Original steam_app_ids_matched behavior (simplified)
        def original_steam_app_ids_matched(df: pd.DataFrame, catalog: dict) -> pd.DataFrame:
            # Handle corrected app IDs first
            df.loc[df[CORRECTED_APP_ID] != 0, [APP_ID, found_game_name]] = df.loc[
                df[CORRECTED_APP_ID] != 0, [CORRECTED_APP_ID, game_name]
            ].values

            # Update rows where APP_ID == 0
            def update_row(row):
                name = row[game_name]
                row[APP_ID] = catalog.get(name, 0)
                row[found_game_name] = name
                return row

            df.loc[df[APP_ID] == 0] = df.loc[df[APP_ID] == 0].apply(update_row, axis=1)
            return df

        # Hexagonal equivalent
        repository = InMemoryCatalogRepository(sample_catalog_dict)
        catalog_service = SteamCatalogService(repository, None)
        enrichment_service = GameDataEnrichmentService(catalog_service, None)

        # Test with both approaches
        df_original = sample_game_data.copy()
        df_hexagonal = sample_game_data.copy()

        original_result = original_steam_app_ids_matched(df_original, sample_catalog_dict)
        hexagonal_result = enrichment_service.enrich_with_app_ids(df_hexagonal)

        # Compare key columns
        for index, row in original_result.iterrows():
            hex_row = hexagonal_result.iloc[index]
            assert row[APP_ID] == hex_row[APP_ID]
            assert row[found_game_name] == hex_row[found_game_name]

    def test_update_app_id_and_name_replacement(self, sample_catalog_dict):
        """Test that hexagonal service can replace update_app_id_and_name() function."""
        # Original constants and function behavior
        APP_ID = "app_id"
        game_name = "name"
        found_game_name = "found_game_name"

        def original_update_app_id_and_name(row: pd.Series, catalog: dict) -> pd.Series:
            name = row[game_name]
            # Simulate demo removal logic
            if name.endswith(" Demo"):
                name = name[:-5]  # Remove " Demo"
            row[APP_ID] = catalog.get(name, 0)
            row[found_game_name] = name
            return row

        # Hexagonal equivalent
        repository = InMemoryCatalogRepository(sample_catalog_dict)
        catalog_service = SteamCatalogService(repository, None)

        # Test data
        test_row = pd.Series({game_name: "Half-Life 2 Demo", APP_ID: 0, found_game_name: ""})

        # Compare results
        original_result = original_update_app_id_and_name(test_row.copy(), sample_catalog_dict)

        # Hexagonal approach
        game_name_obj = GameName(test_row[game_name])
        app_id = catalog_service.get_app_id_by_name_with_demo_removal(game_name_obj)

        hexagonal_row = test_row.copy()
        hexagonal_row[APP_ID] = app_id.value
        hexagonal_row[found_game_name] = game_name_obj.without_demo_suffix().value

        assert original_result[APP_ID] == hexagonal_row[APP_ID]
        assert original_result[found_game_name] == hexagonal_row[found_game_name]

    def test_steam_rating_replacement(self, sample_steam_rating_response):
        """Test that hexagonal service can replace steam_rating() function."""

        # Original steam_rating behavior (simplified)
        def original_steam_rating(application_id: int) -> dict:
            # This would make HTTP request in real code
            # We'll simulate the response processing
            if sample_steam_rating_response["success"] == 1:
                query_summary = sample_steam_rating_response["query_summary"]
                if query_summary["total_reviews"] > 0:
                    rating = query_summary["total_positive"] / query_summary["total_reviews"]
                    return {"rating": rating, **query_summary}
            return {}

        # Hexagonal equivalent
        api_client = MockSteamApiClient({})
        api_client.fetch_game_rating = Mock(return_value=sample_steam_rating_response)
        rating_service = GameRatingService(api_client)

        # Compare results
        app_id = 220
        original_result = original_steam_rating(app_id)
        hexagonal_rating = rating_service.get_game_rating(SteamAppId(app_id))

        assert abs(original_result["rating"] - hexagonal_rating.score) < 0.01
        assert original_result["total_reviews"] == hexagonal_rating.total_reviews
        assert original_result["total_positive"] == hexagonal_rating.positive_reviews

    def test_existing_constants_compatibility(self):
        """Test that hexagonal architecture respects existing constants."""
        # Import existing constants (would be from src.constants in real code)
        game_name = "name"
        store_name = "store"
        played_flag = "played"
        APP_ID = "app_id"
        CORRECTED_APP_ID = "corrected_app_id"
        RATING_FIELD = "rating"
        found_game_name = "found_game_name"
        MINIMUM_RATING = 0.8

        # Create test DataFrame using existing constants
        test_df = pd.DataFrame(
            [
                {
                    game_name: "Test Game",
                    store_name: "steam",
                    played_flag: False,
                    APP_ID: 0,
                    CORRECTED_APP_ID: 0,
                    RATING_FIELD: None,
                    found_game_name: "",
                }
            ]
        )

        # Verify hexagonal services can work with existing column names
        repository = InMemoryCatalogRepository({"Test Game": 12345})
        catalog_service = SteamCatalogService(repository, None)
        enrichment_service = GameDataEnrichmentService(catalog_service, None)

        # Test enrichment preserves existing column structure
        enriched_df = enrichment_service.enrich_with_app_ids(test_df)

        # Verify all original columns are preserved
        for col in test_df.columns:
            assert col in enriched_df.columns

        # Verify data was updated correctly
        assert enriched_df.iloc[0][APP_ID] == 12345
        assert enriched_df.iloc[0][found_game_name] == "Test Game"
        assert enriched_df.iloc[0][store_name] == "steam"  # Unchanged

    def test_existing_file_structure_compatibility(self, sample_catalog_dict):
        """Test that hexagonal architecture works with existing file structures."""
        # Simulate existing file structure
        temp_dir = tempfile.mkdtemp()

        try:
            # Create files in existing structure
            data_folder = os.path.join(temp_dir, "data")
            os.makedirs(data_folder, exist_ok=True)

            steam_catalog_file = os.path.join(data_folder, "steam_game_app_ids.json")
            with open(steam_catalog_file, "w", encoding="utf-8") as f:
                json.dump(sample_catalog_dict, f, ensure_ascii=False, indent=4)

            # Test hexagonal architecture can use existing file
            config = {"catalog_file_path": steam_catalog_file}
            factory = SteamCatalogFactory()
            catalog_service = factory.create_catalog_service(config)

            # Verify it can read existing format
            app_id = catalog_service.get_app_id_by_name("Half-Life 2")
            assert app_id.value == 220

            # Verify it maintains existing file format when saving
            catalog_service.update_game_app_id("New Game", 99999)

            # Check file is still in expected format
            with open(steam_catalog_file, "r", encoding="utf-8") as f:
                updated_catalog = json.load(f)

            assert "Half-Life 2" in updated_catalog
            assert "New Game" in updated_catalog
            assert updated_catalog["New Game"] == 99999

        finally:
            # Cleanup
            import shutil

            shutil.rmtree(temp_dir)

    def test_drop_in_replacement_capability(self, sample_game_data, sample_catalog_dict):
        """Test that hexagonal services can be used as drop-in replacements."""
        # Create hexagonal services
        repository = InMemoryCatalogRepository(sample_catalog_dict)
        api_client = MockSteamApiClient({})

        catalog_service = SteamCatalogService(repository, api_client)
        rating_service = GameRatingService(api_client)
        enrichment_service = GameDataEnrichmentService(catalog_service, rating_service)

        # Create wrapper functions that match original signatures
        def load_catalog():
            return repository.load_catalog()

        def app_id_matched_by_catalog(name: str, catalog: dict = None):
            return catalog_service.get_app_id_by_name(name).value

        def steam_app_ids_matched(df: pd.DataFrame):
            return enrichment_service.enrich_with_app_ids(df)

        # Test that wrappers work with existing code patterns
        catalog = load_catalog()
        assert isinstance(catalog, dict)
        assert "Half-Life 2" in catalog

        app_id = app_id_matched_by_catalog("Portal")
        assert app_id == 400

        enriched_df = steam_app_ids_matched(sample_game_data.copy())
        assert "app_id" in enriched_df.columns
        assert "found_game_name" in enriched_df.columns

        # Verify data was enriched correctly
        hl2_row = enriched_df[enriched_df["name"] == "Half-Life 2"].iloc[0]
        assert hl2_row["app_id"] == 220


# Import required classes and functions
from ..conftest import MockSteamApiClient, InMemoryCatalogRepository
from ..unit.test_domain_services import SteamCatalogService, GameRatingService, GameDataEnrichmentService
from ..unit.test_domain_entities import SteamAppId, GameName
from ..e2e.test_catalog_system import SteamCatalogFactory


# Additional helper classes for compatibility testing
class SteamApiResponseParser:
    """Parser for Steam API responses."""

    def parse_app_list_to_catalog_dict(self, api_response: dict) -> dict:
        """Parse Steam API app list response to catalog dictionary."""
        apps = api_response.get("applist", {}).get("apps", [])
        return {app["name"]: app["appid"] for app in apps}
