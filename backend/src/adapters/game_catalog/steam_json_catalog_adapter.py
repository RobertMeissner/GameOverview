import json
import os


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
                    self._catalog = json.load(file)
            self._loaded = True

    def game_by_id(self, _game_id: str):
        print(id)
        self.load_catalog()
        return []

    def catalog(self):
        self.load_catalog()
        return self._catalog
