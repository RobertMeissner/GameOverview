"""
Unit tests for Steam catalog domain entities.
Tests the core business objects without external dependencies.
"""

import pytest
from dataclasses import FrozenInstanceError

from domain.ports.game_catalog import GameCatalog


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestSteamAppId:
    """Test cases for SteamAppId value object."""

    def test_create_valid_app_id(self):
        """Test creating a valid SteamAppId."""
        app_id = SteamAppId(220)
        assert app_id.value == 220
        assert str(app_id) == "220"
        assert repr(app_id) == "SteamAppId(220)"

    def test_create_zero_app_id(self):
        """Test creating a SteamAppId with value 0 (unknown/unmatched)."""
        app_id = SteamAppId(0)
        assert app_id.value == 0
        assert app_id.is_unknown()

    def test_negative_app_id_raises_error(self):
        """Test that negative app IDs raise ValueError."""
        with pytest.raises(ValueError, match="Steam App ID must be non-negative"):
            SteamAppId(-1)

    def test_app_id_is_immutable(self):
        """Test that SteamAppId is immutable."""
        app_id = SteamAppId(220)
        with pytest.raises(FrozenInstanceError):
            app_id.value = 440

    def test_app_id_equality(self):
        """Test SteamAppId equality comparison."""
        app_id1 = SteamAppId(220)
        app_id2 = SteamAppId(220)
        app_id3 = SteamAppId(440)

        assert app_id1 == app_id2
        assert app_id1 != app_id3
        assert hash(app_id1) == hash(app_id2)
        assert hash(app_id1) != hash(app_id3)

    def test_is_unknown(self):
        """Test is_unknown method."""
        unknown_app_id = SteamAppId(0)
        known_app_id = SteamAppId(220)

        assert unknown_app_id.is_unknown()
        assert not known_app_id.is_unknown()


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestGameName:
    """Test cases for GameName value object."""

    def test_create_valid_game_name(self):
        """Test creating a valid GameName."""
        name = GameName("Half-Life 2")
        assert name.value == "Half-Life 2"
        assert str(name) == "Half-Life 2"
        assert repr(name) == "GameName('Half-Life 2')"

    def test_empty_game_name_raises_error(self):
        """Test that empty game names raise ValueError."""
        with pytest.raises(ValueError, match="Game name cannot be empty"):
            GameName("")

        with pytest.raises(ValueError, match="Game name cannot be empty"):
            GameName("   ")

    def test_game_name_is_normalized(self):
        """Test that game names are normalized (stripped)."""
        name = GameName("  Half-Life 2  ")
        assert name.value == "Half-Life 2"

    def test_game_name_is_immutable(self):
        """Test that GameName is immutable."""
        name = GameName("Half-Life 2")
        with pytest.raises(FrozenInstanceError):
            name.value = "Portal"

    def test_game_name_equality(self):
        """Test GameName equality comparison."""
        name1 = GameName("Half-Life 2")
        name2 = GameName("Half-Life 2")
        name3 = GameName("Portal")

        assert name1 == name2
        assert name1 != name3
        assert hash(name1) == hash(name2)
        assert hash(name1) != hash(name3)

    def test_normalized_for_search(self):
        """Test normalized_for_search method."""
        name = GameName("Half-Life 2: Episode One")
        normalized = name.normalized_for_search()

        assert normalized == "half-life 2: episode one"

    def test_without_demo_suffix(self):
        """Test without_demo_suffix method."""
        demo_name = GameName("Half-Life 2 Demo")
        regular_name = GameName("Half-Life 2")

        assert demo_name.without_demo_suffix().value == "Half-Life 2"
        assert regular_name.without_demo_suffix().value == "Half-Life 2"


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestGameCatalogEntry:
    """Test cases for GameCatalogEntry entity."""

    def test_create_valid_entry(self):
        """Test creating a valid GameCatalogEntry."""
        name = GameName("Half-Life 2")
        app_id = SteamAppId(220)
        entry = GameCatalogEntry(name, app_id)

        assert entry.name == name
        assert entry.app_id == app_id
        assert str(entry) == "GameCatalogEntry('Half-Life 2', 220)"

    def test_entry_equality(self):
        """Test GameCatalogEntry equality comparison."""
        name1 = GameName("Half-Life 2")
        name2 = GameName("Half-Life 2")
        app_id1 = SteamAppId(220)
        app_id2 = SteamAppId(220)

        entry1 = GameCatalogEntry(name1, app_id1)
        entry2 = GameCatalogEntry(name2, app_id2)
        entry3 = GameCatalogEntry(GameName("Portal"), SteamAppId(400))

        assert entry1 == entry2
        assert entry1 != entry3
        assert hash(entry1) == hash(entry2)
        assert hash(entry1) != hash(entry3)

    def test_has_known_app_id(self):
        """Test has_known_app_id method."""
        known_entry = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220))
        unknown_entry = GameCatalogEntry(GameName("Unknown Game"), SteamAppId(0))

        assert known_entry.has_known_app_id()
        assert not unknown_entry.has_known_app_id()


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestGameCatalog:
    """Test cases for GameCatalog aggregate root."""

    def test_create_empty_catalog(self):
        """Test creating an empty GameCatalog."""
        catalog = GameCatalog()
        assert len(catalog) == 0
        assert catalog.is_empty()
        assert list(catalog.entries()) == []

    def test_create_catalog_with_entries(self):
        """Test creating a GameCatalog with initial entries."""
        entries = [GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)), GameCatalogEntry(GameName("Portal"), SteamAppId(400))]
        catalog = GameCatalog(entries)

        assert len(catalog) == 2
        assert not catalog.is_empty()
        assert list(catalog.entries()) == entries

    def test_add_entry(self):
        """Test adding an entry to the catalog."""
        catalog = GameCatalog()
        entry = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220))

        catalog.add_entry(entry)

        assert len(catalog) == 1
        assert entry in catalog.entries()

    def test_add_duplicate_entry_replaces_existing(self):
        """Test that adding a duplicate entry replaces the existing one."""
        catalog = GameCatalog()

        # Add initial entry
        entry1 = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220))
        catalog.add_entry(entry1)

        # Add entry with same name but different app_id
        entry2 = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(440))
        catalog.add_entry(entry2)

        assert len(catalog) == 1
        app_id = catalog.find_app_id_by_name(GameName("Half-Life 2"))
        assert app_id == SteamAppId(440)

    def test_find_app_id_by_name_existing(self):
        """Test finding app ID for existing game name."""
        entries = [GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)), GameCatalogEntry(GameName("Portal"), SteamAppId(400))]
        catalog = GameCatalog(entries)

        app_id = catalog.find_app_id_by_name(GameName("Half-Life 2"))
        assert app_id == SteamAppId(220)

    def test_find_app_id_by_name_missing(self):
        """Test finding app ID for non-existing game name."""
        catalog = GameCatalog()

        app_id = catalog.find_app_id_by_name(GameName("Non-existent Game"))
        assert app_id == SteamAppId(0)

    def test_contains_game(self):
        """Test checking if catalog contains a game."""
        entry = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220))
        catalog = GameCatalog([entry])

        assert catalog.contains_game(GameName("Half-Life 2"))
        assert not catalog.contains_game(GameName("Portal"))

    def test_remove_entry(self):
        """Test removing an entry from the catalog."""
        entry = GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220))
        catalog = GameCatalog([entry])

        catalog.remove_entry(GameName("Half-Life 2"))

        assert len(catalog) == 0
        assert not catalog.contains_game(GameName("Half-Life 2"))

    def test_remove_nonexistent_entry_does_nothing(self):
        """Test removing a non-existent entry does nothing."""
        catalog = GameCatalog()

        # Should not raise an exception
        catalog.remove_entry(GameName("Non-existent Game"))

        assert len(catalog) == 0

    def test_get_entries_with_unknown_app_ids(self):
        """Test getting entries with unknown app IDs."""
        entries = [
            GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)),
            GameCatalogEntry(GameName("Unknown Game 1"), SteamAppId(0)),
            GameCatalogEntry(GameName("Portal"), SteamAppId(400)),
            GameCatalogEntry(GameName("Unknown Game 2"), SteamAppId(0)),
        ]
        catalog = GameCatalog(entries)

        unknown_entries = catalog.get_entries_with_unknown_app_ids()

        assert len(unknown_entries) == 2
        assert all(entry.app_id.is_unknown() for entry in unknown_entries)

        unknown_names = [entry.name.value for entry in unknown_entries]
        assert "Unknown Game 1" in unknown_names
        assert "Unknown Game 2" in unknown_names

    def test_merge_catalog(self):
        """Test merging another catalog."""
        catalog1 = GameCatalog(
            [GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)), GameCatalogEntry(GameName("Portal"), SteamAppId(400))]
        )

        catalog2 = GameCatalog(
            [
                GameCatalogEntry(GameName("Portal"), SteamAppId(401)),  # Different app_id
                GameCatalogEntry(GameName("Team Fortress 2"), SteamAppId(440)),
            ]
        )

        catalog1.merge_catalog(catalog2)

        assert len(catalog1) == 3
        # Portal should have the updated app_id from catalog2
        assert catalog1.find_app_id_by_name(GameName("Portal")) == SteamAppId(401)
        assert catalog1.find_app_id_by_name(GameName("Team Fortress 2")) == SteamAppId(440)

    def test_to_dict(self):
        """Test converting catalog to dictionary."""
        entries = [GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)), GameCatalogEntry(GameName("Portal"), SteamAppId(400))]
        catalog = GameCatalog(entries)

        catalog_dict = catalog.to_dict()

        expected = {"Half-Life 2": 220, "Portal": 400}
        assert catalog_dict == expected

    def test_from_dict(self):
        """Test creating catalog from dictionary."""
        catalog_dict = {"Half-Life 2": 220, "Portal": 400, "Team Fortress 2": 440}

        catalog = GameCatalog.from_dict(catalog_dict)

        assert len(catalog) == 3
        assert catalog.find_app_id_by_name(GameName("Half-Life 2")) == SteamAppId(220)
        assert catalog.find_app_id_by_name(GameName("Portal")) == SteamAppId(400)
        assert catalog.find_app_id_by_name(GameName("Team Fortress 2")) == SteamAppId(440)

    def test_catalog_statistics(self):
        """Test getting catalog statistics."""
        entries = [
            GameCatalogEntry(GameName("Half-Life 2"), SteamAppId(220)),
            GameCatalogEntry(GameName("Unknown Game 1"), SteamAppId(0)),
            GameCatalogEntry(GameName("Portal"), SteamAppId(400)),
            GameCatalogEntry(GameName("Unknown Game 2"), SteamAppId(0)),
        ]
        catalog = GameCatalog(entries)

        stats = catalog.get_statistics()

        expected = {"total_entries": 4, "known_app_ids": 2, "unknown_app_ids": 2, "completion_rate": 0.5}
        assert stats == expected


# These classes would be implemented in the actual domain layer
# Here we provide the interface they should conform to


class SteamAppId:
    """Value object representing a Steam Application ID."""

    pass


class GameName:
    """Value object representing a game name."""

    pass


class GameCatalogEntry:
    """Entity representing a game catalog entry."""

    pass
