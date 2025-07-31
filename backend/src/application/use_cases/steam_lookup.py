from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from domain.ports.steam_api import SteamAPI


class SteamLookup:
    """Use case for Steam game lookup operations."""

    def __init__(self, steam_api: SteamAPI) -> None:
        self._steam_api = steam_api

    def lookup_by_app_id(self, app_id: int) -> dict | None:
        """Look up Steam game by app ID."""
        return self._steam_api.get_game_by_app_id(app_id)

    def search_by_name(self, name: str) -> tuple[int, str]:
        """Search for Steam game by name."""
        return self._steam_api.search_game_by_name(name)
