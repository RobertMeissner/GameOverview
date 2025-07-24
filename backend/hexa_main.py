import os

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter
from dotenv import load_dotenv

from application.use_cases.catalog import Catalog

load_dotenv()


def all_games_in_catalog() -> None:
    catalog_adapter = SteamJSONCatalogAdapter(os.getenv("STEAM_JSON_CATALOG"))
    catalog = Catalog(catalog_adapter)
    games = catalog.games()
    print(f"Games in Catalog: {len(games)}")
    print(f"{catalog.game_by_steam_id(70)}")


def main():
    all_games_in_catalog()


if __name__ == "__main__":
    main()
