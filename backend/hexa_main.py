import os

from adapters.game_catalog.steam_json_catalog_adapter import SteamJSONCatalogAdapter
from dotenv import load_dotenv

from application.use_cases.catalog import Catalog

load_dotenv()


def main():
    catalog_adapter = SteamJSONCatalogAdapter(os.getenv("STEAM_JSON_CATALOG"))
    catalog = Catalog(catalog_adapter)
    print(catalog.catalog())


if __name__ == "__main__":
    main()
