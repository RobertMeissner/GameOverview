from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from domain.entity.game import Game
    from domain.ports.game_catalog import GameCatalog


class Catalog:
    def __init__(self, catalog: GameCatalog) -> None:
        self._catalog = catalog
        self._load_games()

    def _load_games(self) -> list[Game]:
        self._games = self._catalog.games()

    def games(self) -> list[Game]:
        return self._games

    def game_by_steam_id(self, steam_id: int) -> Game | None:
        return self._catalog.steam_game_by_id(steam_id)
