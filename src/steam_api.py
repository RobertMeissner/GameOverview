import json
import os

import pandas as pd
import requests
from dotenv import load_dotenv

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
    return pd.DataFrame(games)


if __name__ == "__main__":
    df = steam_games()
    print(df.info())
    print(df.head())
