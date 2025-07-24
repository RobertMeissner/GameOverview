"""
Integration tests for JSON file-based catalog repository.
Tests the adapter layer with real file system operations.
"""

import json
import os
import tempfile
import pytest

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter
from domain.entity.game import Game, PlayStatus


class TestSteamJSONCatalogAdapter:
    def test_create_empty_catalog(self):
        """Test creating an empty GameCatalog."""
        adapter = SteamJSONCatalogAdapter("")
        catalog = adapter.games()
        assert len(catalog) == 0
        assert list(catalog) == []

    def test_catalog_protocol_behavior(self):
        test_json_path = "backend/tests/fixtures/data/steam_catalog_test.json"
        adapter = SteamJSONCatalogAdapter(test_json_path)

        assert adapter.steam_game_by_id(1) is not None
        assert len(adapter.games()) == 3


@pytest.mark.skip(reason="Not being implemented")
class TestJsonCatalogRepository:
    """Test cases for JsonCatalogRepository adapter."""

    def test_load_catalog_existing_file(self, temp_catalog_file, sample_catalog_dict):
        """Test loading catalog from existing JSON file."""
        repository = JsonCatalogRepository(temp_catalog_file)

        catalog = repository.load_catalog()

        assert catalog == sample_catalog_dict
        assert isinstance(catalog, dict)
        assert "Half-Life 2" in catalog
        assert catalog["Half-Life 2"] == 220

    def test_load_catalog_nonexistent_file(self, nonexistent_catalog_file):
        """Test loading catalog from non-existent file returns empty dict."""
        repository = JsonCatalogRepository(nonexistent_catalog_file)

        catalog = repository.load_catalog()

        assert catalog == {}
        assert isinstance(catalog, dict)

    def test_load_catalog_empty_file(self, empty_temp_catalog_file):
        """Test loading catalog from empty JSON file."""
        repository = JsonCatalogRepository(empty_temp_catalog_file)

        catalog = repository.load_catalog()

        assert catalog == {}

    def test_load_catalog_invalid_json(self):
        """Test loading catalog from file with invalid JSON."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write("{ invalid json content")
            invalid_file = f.name

        try:
            repository = JsonCatalogRepository(invalid_file)

            with pytest.raises(CatalogLoadError, match="Failed to load catalog"):
                repository.load_catalog()
        finally:
            os.unlink(invalid_file)

    def test_save_catalog_new_file(self, nonexistent_catalog_file, sample_catalog_dict):
        """Test saving catalog to new file."""
        repository = JsonCatalogRepository(nonexistent_catalog_file)

        repository.save_catalog(sample_catalog_dict)

        # Verify file was created and contains correct data
        assert os.path.exists(nonexistent_catalog_file)
        with open(nonexistent_catalog_file, "r", encoding="utf-8") as f:
            saved_data = json.load(f)
        assert saved_data == sample_catalog_dict

        # Cleanup
        os.unlink(nonexistent_catalog_file)

    def test_save_catalog_existing_file(self, temp_catalog_file):
        """Test saving catalog to existing file overwrites content."""
        repository = JsonCatalogRepository(temp_catalog_file)

        new_catalog = {"New Game 1": 11111, "New Game 2": 22222}

        repository.save_catalog(new_catalog)

        # Verify file was overwritten
        with open(temp_catalog_file, "r", encoding="utf-8") as f:
            saved_data = json.load(f)
        assert saved_data == new_catalog
        assert "Half-Life 2" not in saved_data  # Old data should be gone

    def test_save_catalog_permission_error(self, sample_catalog_dict):
        """Test handling permission error when saving catalog."""
        read_only_path = "/root/read_only_catalog.json"
        repository = JsonCatalogRepository(read_only_path)

        with pytest.raises(CatalogSaveError, match="Failed to save catalog"):
            repository.save_catalog(sample_catalog_dict)

    def test_save_catalog_creates_directory(self, sample_catalog_dict):
        """Test that saving catalog creates parent directories if needed."""
        nested_path = "/tmp/test_nested/deep/catalog.json"
        repository = JsonCatalogRepository(nested_path)

        try:
            repository.save_catalog(sample_catalog_dict)

            # Verify file was created
            assert os.path.exists(nested_path)
            with open(nested_path, "r", encoding="utf-8") as f:
                saved_data = json.load(f)
            assert saved_data == sample_catalog_dict
        finally:
            # Cleanup
            if os.path.exists(nested_path):
                os.unlink(nested_path)
                os.rmdir(os.path.dirname(nested_path))
                os.rmdir(os.path.dirname(os.path.dirname(nested_path)))

    def test_catalog_exists_true(self, temp_catalog_file):
        """Test catalog_exists returns True for existing file."""
        repository = JsonCatalogRepository(temp_catalog_file)

        assert repository.catalog_exists() is True

    def test_catalog_exists_false(self, nonexistent_catalog_file):
        """Test catalog_exists returns False for non-existent file."""
        repository = JsonCatalogRepository(nonexistent_catalog_file)

        assert repository.catalog_exists() is False

    def test_get_catalog_metadata(self, temp_catalog_file):
        """Test getting catalog file metadata."""
        repository = JsonCatalogRepository(temp_catalog_file)

        metadata = repository.get_catalog_metadata()

        assert "file_size" in metadata
        assert "last_modified" in metadata
        assert "entry_count" in metadata
        assert metadata["entry_count"] == 10  # From sample_catalog_dict
        assert metadata["file_size"] > 0

    def test_backup_catalog(self, temp_catalog_file):
        """Test creating a backup of the catalog file."""
        repository = JsonCatalogRepository(temp_catalog_file)

        backup_path = repository.backup_catalog()

        try:
            # Verify backup was created
            assert os.path.exists(backup_path)
            assert backup_path.endswith(".backup")

            # Verify backup contains same data
            with open(backup_path, "r", encoding="utf-8") as f:
                backup_data = json.load(f)
            with open(temp_catalog_file, "r", encoding="utf-8") as f:
                original_data = json.load(f)
            assert backup_data == original_data
        finally:
            if os.path.exists(backup_path):
                os.unlink(backup_path)

    def test_restore_from_backup(self, temp_catalog_file, sample_catalog_dict):
        """Test restoring catalog from backup."""
        repository = JsonCatalogRepository(temp_catalog_file)

        # Create backup
        backup_path = repository.backup_catalog()

        try:
            # Modify original file
            new_data = {"Modified": 999}
            repository.save_catalog(new_data)

            # Restore from backup
            repository.restore_from_backup(backup_path)

            # Verify original data was restored
            restored_catalog = repository.load_catalog()
            assert restored_catalog == sample_catalog_dict
        finally:
            if os.path.exists(backup_path):
                os.unlink(backup_path)

    def test_load_catalog_with_encoding_issues(self):
        """Test loading catalog with various encoding issues."""
        # Create file with non-UTF8 characters
        catalog_with_unicode = {
            "Café Simulator": 12345,
            "François' Adventure": 67890,
            "游戏名称": 11111,  # Chinese characters
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(catalog_with_unicode, f, ensure_ascii=False, indent=2)
            unicode_file = f.name

        try:
            repository = JsonCatalogRepository(unicode_file)
            catalog = repository.load_catalog()

            assert catalog == catalog_with_unicode
            assert "Café Simulator" in catalog
            assert "游戏名称" in catalog
        finally:
            os.unlink(unicode_file)

    def test_concurrent_access_safety(self, temp_catalog_file, sample_catalog_dict):
        """Test that concurrent access doesn't corrupt the catalog."""
        repository = JsonCatalogRepository(temp_catalog_file)

        # Simulate concurrent read while writing
        import threading
        import time

        results = []
        errors = []

        def reader():
            try:
                for _ in range(10):
                    catalog = repository.load_catalog()
                    results.append(len(catalog))
                    time.sleep(0.01)
            except Exception as e:
                errors.append(e)

        def writer():
            try:
                for i in range(5):
                    test_catalog = sample_catalog_dict.copy()
                    test_catalog[f"Test Game {i}"] = 1000 + i
                    repository.save_catalog(test_catalog)
                    time.sleep(0.02)
            except Exception as e:
                errors.append(e)

        # Start threads
        reader_thread = threading.Thread(target=reader)
        writer_thread = threading.Thread(target=writer)

        reader_thread.start()
        writer_thread.start()

        reader_thread.join()
        writer_thread.join()

        # Verify no errors occurred
        assert len(errors) == 0
        assert len(results) == 10  # All reads completed
        assert all(count > 0 for count in results)  # All reads returned data


@pytest.mark.skip(reason="Not being implemented")
class TestParquetCatalogRepository:
    """Test cases for ParquetCatalogRepository adapter (legacy format support)."""

    def test_load_catalog_from_parquet(self):
        """Test loading catalog from existing parquet file format."""
        # Create sample parquet data
        import pandas as pd

        sample_data = pd.DataFrame(
            {"name": ["Half-Life 2", "Portal", "Team Fortress 2"], "app_id": [220, 400, 440], "store": ["steam", "steam", "steam"]}
        )

        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as f:
            parquet_file = f.name
            sample_data.to_parquet(parquet_file)

        try:
            repository = ParquetCatalogRepository(parquet_file)
            catalog = repository.load_catalog()

            expected = {"Half-Life 2": 220, "Portal": 400, "Team Fortress 2": 440}
            assert catalog == expected
        finally:
            os.unlink(parquet_file)

    def test_save_catalog_to_parquet(self):
        """Test saving catalog to parquet format."""
        import pandas as pd

        catalog_dict = {"Half-Life 2": 220, "Portal": 400, "Team Fortress 2": 440}

        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as f:
            parquet_file = f.name

        try:
            repository = ParquetCatalogRepository(parquet_file)
            repository.save_catalog(catalog_dict)

            # Verify file was created and contains correct data
            assert os.path.exists(parquet_file)
            df = pd.read_parquet(parquet_file)

            assert len(df) == 3
            assert "name" in df.columns
            assert "app_id" in df.columns

            # Convert back to dict to verify
            result_dict = dict(zip(df["name"], df["app_id"]))
            assert result_dict == catalog_dict
        finally:
            if os.path.exists(parquet_file):
                os.unlink(parquet_file)


@pytest.mark.skip(reason="Not being implemented")
class TestInMemoryCatalogRepository:
    """Test cases for InMemoryCatalogRepository (testing adapter)."""

    def test_load_empty_catalog(self):
        """Test loading from empty in-memory repository."""
        repository = InMemoryCatalogRepository()

        catalog = repository.load_catalog()

        assert catalog == {}

    def test_load_catalog_with_initial_data(self, sample_catalog_dict):
        """Test loading from in-memory repository with initial data."""
        repository = InMemoryCatalogRepository(sample_catalog_dict)

        catalog = repository.load_catalog()

        assert catalog == sample_catalog_dict

    def test_save_and_load_catalog(self, sample_catalog_dict):
        """Test saving and loading catalog in memory."""
        repository = InMemoryCatalogRepository()

        repository.save_catalog(sample_catalog_dict)
        catalog = repository.load_catalog()

        assert catalog == sample_catalog_dict

    def test_catalog_isolation(self, sample_catalog_dict):
        """Test that modifications to returned catalog don't affect repository."""
        repository = InMemoryCatalogRepository(sample_catalog_dict)

        catalog = repository.load_catalog()
        catalog["New Game"] = 99999

        # Repository should still have original data
        original_catalog = repository.load_catalog()
        assert "New Game" not in original_catalog
        assert original_catalog == sample_catalog_dict

    def test_catalog_exists(self, sample_catalog_dict):
        """Test catalog_exists method."""
        empty_repository = InMemoryCatalogRepository()
        filled_repository = InMemoryCatalogRepository(sample_catalog_dict)

        assert empty_repository.catalog_exists() is False
        assert filled_repository.catalog_exists() is True


# Repository implementations that would be created
class JsonCatalogRepository:
    """JSON file-based catalog repository implementation."""

    pass


class ParquetCatalogRepository:
    """Parquet file-based catalog repository implementation (legacy support)."""

    pass


class InMemoryCatalogRepository:
    """In-memory catalog repository implementation (for testing)."""

    pass


# Repository exceptions
class CatalogLoadError(Exception):
    """Exception raised when catalog loading fails."""

    pass


class CatalogSaveError(Exception):
    """Exception raised when catalog saving fails."""

    pass
