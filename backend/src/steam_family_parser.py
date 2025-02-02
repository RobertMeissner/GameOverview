import re

import pandas as pd
from bs4 import BeautifulSoup
from src.constants import APP_ID, DATA_FOLDER, game_name, played_flag, store_name
from src.utils import coerce_dataframe_types, init_df


def parse_steam_family_html_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

    with open(file_path, encoding="utf-8") as file:
        html = file.read()

    soup = BeautifulSoup(html, "html.parser")

    def extract_game_data(html_soup):
        games = []
        for img in html_soup.find_all(
            "img", class_="_3dBfx1sV1COVdSsh7RdgMd"
        ):  # Adjust class if needed
            alt_text = img.get("alt", "Unknown")
            src = img.get("src", "")

            match = re.search(r"apps/(\d+)/", src)
            app_id = match.group(1) if match else "Not found"

            games.append({game_name: alt_text, APP_ID: app_id})

        return games

    data = extract_game_data(soup)

    new_rows = []
    for game in data:
        new_rows.append(
            {game_name: game[game_name], store_name: "steam", played_flag: False}
        )

    new_df = pd.DataFrame(new_rows)
    return coerce_dataframe_types(pd.concat([df, new_df], ignore_index=True))


def steam_family_games():
    return parse_steam_family_html_for_gamelist(
        DATA_FOLDER + "/steam_family_account.html"
    )


if __name__ == "__main__":
    # Go to https://store.steampowered.com/account/familymanagement?tab=library
    # "Show all"
    # scroll down, copy html for the list
    df = parse_steam_family_html_for_gamelist(
        DATA_FOLDER + "/steam_family_account.html"
    )
    print(df.head())
