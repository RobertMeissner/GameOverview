from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class SteamAPI(Protocol):
    """Steam API port for external Steam integration."""

    def get_game_by_app_id(self, app_id: int) -> dict | None:
        """Get Steam game details by app ID.

        Args:
            app_id: Steam application ID

        Returns:
            Dict containing game details or None if not found

        """
        ...

    def search_game_by_name(self, name: str) -> tuple[int, str]:
        """Search for a Steam game by name.

        Args:
            name: Game name to search for

        Returns:
            Tuple of (app_id, matched_name)

        """
        ...
