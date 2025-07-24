import json
import os

from domain.entity.game import PlayStatus, Game


class SteamJSONCatalogAdapter:
    """
    Adapter to STEAM catalog JSON
    """

    def __init__(self, json_catalog_path: str):
        """
        Init.
        :param json_catalog_path: file ref
        """
        self._json_catalog_path = json_catalog_path
        self._loaded = False
        self._catalog = []

    def load_catalog(self):
        if not self._loaded:
            if os.path.exists(self._json_catalog_path):
                # TODO: Loading fails partially
                with open(self._json_catalog_path, encoding="utf-8") as file:
                    data: dict = json.load(file)

                self._catalog = [
                    Game(steam_id=steam_id, name=name, platforms=["steam"], play_status=PlayStatus.NOT_STARTED, gog_id=0)
                    for name, steam_id in data.items()
                ]

            self._loaded = True

    def steam_game_by_id(self, _game_id: str):
        self.load_catalog()
        return next((g for g in self._catalog if g.steam_id == _game_id), None)

    def games(self):
        self.load_catalog()
        return self._catalog
