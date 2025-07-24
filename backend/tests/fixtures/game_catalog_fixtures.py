import pytest
from domain.ports.game_catalog import GameCatalog
from domain.entity.game import Game


class MockGameCatalog:
    def __init__(self, games: list[Game] = None):
        self._games = games or []

    def steam_game_by_id(self, game_id: int) -> Game | None:
        return next((g for g in self._games if g.steam_id == game_id), None)

    def games(self) -> list[Game]:
        return self._games.copy()


@pytest.fixture
def mock_game_catalog():
    return MockGameCatalog()
