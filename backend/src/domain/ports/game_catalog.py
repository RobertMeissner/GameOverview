from __future__ import annotations

from typing import TYPE_CHECKING, Protocol, runtime_checkable

if TYPE_CHECKING:
    from domain.entity.game import Game


@runtime_checkable
class GameCatalog(Protocol):
    """Catalog placeholder."""

    def steam_game_by_id(self, _game_id: int) -> Game | None:
        """Get game by id."""
        ...

    def games(self) -> list[Game]:
        """Get the entire catalog of games.

        :return:
        """
        ...
