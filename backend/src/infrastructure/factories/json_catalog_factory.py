import os

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter


def steam_json_catalog_adapter() -> SteamJSONCatalogAdapter:
    """Adapter using JSON catalog file.

    :return: adapter
    """
    catalog_path = os.getenv("STEAM_JSON_CATALOG")
    if catalog_path:
        return SteamJSONCatalogAdapter(catalog_path)
    error_msg = "STEAM_JSON_CATALOG not set"
    raise ValueError(error_msg)
