import json
import os

import pandas as pd
import requests
from dotenv import load_dotenv

from src.constants import APP_ID, played_flag, store_name
from src.utils import add_columns

load_dotenv()

steam_api_key = os.getenv("STEAM_API_KEY", "")
steam_id = os.getenv("STEAM_ID", "")


def steam_games() -> pd.DataFrame:
    url = (
        f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={steam_api_key}&"
        f"steamid={steam_id}&format=json&include_appinfo=1&include_played_free_games=1"
    )

    payload = {}
    headers = {}

    response = requests.request("GET", url, headers=headers, data=payload)

    games = json.loads(response.text)["response"]["games"]
    print(len(games), " Steam games")
    df = pd.DataFrame(games)
    df[store_name] = "steam"
    df[played_flag] = False
    df = add_columns(df)
    df[APP_ID] = df["appid"]
    df = df.drop(columns=["appid"])
    return df


if __name__ == "__main__":
    games = steam_games()
    print(games.info())
    print(games.head())
