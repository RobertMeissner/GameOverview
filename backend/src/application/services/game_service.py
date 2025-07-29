from __future__ import annotations

from typing import TYPE_CHECKING, Callable

from application.use_cases.catalog import Catalog

if TYPE_CHECKING:
    from domain.entity.game import Game
    from domain.ports.game_catalog import GameCatalog


class GameService:
    def __init__(self, catalog_factory: Callable[[], GameCatalog]) -> None:
        self._catalog_factory = catalog_factory

    def all_games(self) -> list[Game]:
        catalog = Catalog(self._catalog_factory())
        games = catalog.games()
        return games[0:10]

    def steam_game(self, steam_id: int) -> Game | None:
        return Catalog(self._catalog_factory()).game_by_steam_id(steam_id)
