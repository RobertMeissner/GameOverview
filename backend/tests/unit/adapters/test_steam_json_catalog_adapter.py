import json
import tempfile
from pathlib import Path

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter


class TestSteamJSONCatalogAdapter:
    def test_loads_empty_catalog(self):
        # Arrange
        test_data = []
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(test_data, f)
            temp_path = f.name

        # Act
        adapter = SteamJSONCatalogAdapter(temp_path)
        games = adapter.catalog()

        # Assert
        assert games == []

        # Cleanup
        Path(temp_path).unlink()
