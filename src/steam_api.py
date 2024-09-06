import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()

steam_api_key = os.getenv("STEAM_API_KEY", "")
steam_id = os.getenv("STEAM_ID", "")


def steam_games():
    url = (
        f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={steam_api_key}&"
        f"steamid={steam_id}&format=json&include_appinfo=1&include_played_free_games=1"
    )

    payload = {}
    headers = {}

    response = requests.request("GET", url, headers=headers, data=payload)

    games = json.loads(response.text)["response"]["games"]
    print("Number of games: ", len(games))


if __name__ == "__main__":
    steam_games()
