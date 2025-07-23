from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from domain.entity.game import Game
    from domain.ports.game_catalog import GameCatalog


class Catalog:
    def __init__(self, catalog: GameCatalog) -> None:
        self._catalog = catalog

    def catalog(self) -> list[Game]:
        return self._catalog.catalog()
