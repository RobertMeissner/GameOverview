from __future__ import annotations

from typing import TYPE_CHECKING, Callable

from application.use_cases.catalog import Catalog
from application.use_cases.steam_lookup import SteamLookup

if TYPE_CHECKING:
    from domain.entity.game import Game
    from domain.ports.game_catalog import GameCatalog
    from domain.ports.steam_api import SteamAPI


class GameService:
    def __init__(self, catalog_factory: Callable[[], GameCatalog], steam_api_factory: Callable[[], SteamAPI] | None = None) -> None:
        self._catalog_factory = catalog_factory
        self._steam_api_factory = steam_api_factory

    def all_games(self) -> list[Game]:
        catalog = Catalog(self._catalog_factory())
        games = catalog.games()
        return games[0:10]

    def steam_game(self, steam_id: int) -> Game | None:
        return Catalog(self._catalog_factory()).game_by_steam_id(steam_id)

    def lookup_steam_game_by_app_id(self, app_id: int) -> dict | None:
        """Look up Steam game by app ID."""
        if not self._steam_api_factory:
            return None
        steam_api = self._steam_api_factory()
        steam_lookup = SteamLookup(steam_api)
        return steam_lookup.lookup_by_app_id(app_id)

    def search_steam_game_by_name(self, name: str) -> tuple[int, str]:
        """Search for Steam game by name."""
        if not self._steam_api_factory:
            return 0, name
        steam_api = self._steam_api_factory()
        steam_lookup = SteamLookup(steam_api)
        return steam_lookup.search_by_name(name)
