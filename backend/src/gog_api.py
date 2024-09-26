# Description: Utility to find the names of games owned on GOG.
# Based on https://github.com/NikkelM/Steam-App-ID-Finder
import os

import pandas as pd
import requests
from dotenv import load_dotenv
from src.constants import (
    DATA_FILEPATH,
    DATA_FOLDER,
    GOG_FILEPATH,
    game_name,
    played_flag,
    store_name,
)
from src.utils import load_data
from tqdm import tqdm

load_dotenv()
CONFIG = {
    "refreshToken": os.getenv("refreshToken", None),
    "gogLoginCode": os.getenv("gogLoginCode", None),
    "mode": "gog",
}


def save_gog(df: pd.DataFrame, filename=GOG_FILEPATH):
    df.to_parquet(filename)


def gog_games() -> pd.DataFrame:
    if os.path.exists(GOG_FILEPATH):
        df = load_data(filename=GOG_FILEPATH)
    else:
        if CONFIG["refreshToken"]:
            access_token, refresh_token = gog_access_token(None, CONFIG["refreshToken"])
        elif CONFIG["gogLoginCode"]:
            access_token, refresh_token = gog_access_token(CONFIG["gogLoginCode"], None)
        else:
            # FIXME: Annoying return call
            return pd.DataFrame()

        print(
            'Writing refresh token to "data/gogRefreshToken.txt". Use this token in the config file to avoid having to '
            "log in next time you run the script.\n"
        )
        with open(f"{DATA_FOLDER}/gogRefreshToken.txt", "w") as f:
            f.write(refresh_token)

        # Get the list of apps owned on GOG
        gogAppIds = gog_apps_ids(access_token)

        # Get the game names for the corresponding game IDs
        df = enrich_games(gogAppIds, access_token)

    df["downloads"] = df["downloads"].astype(str)
    df["dlcs"] = df["dlcs"].astype(str)
    df = df.rename(columns={"title": game_name})
    df = df.rename(columns={"appid": "gog_app_id"})
    df[store_name] = "gog"
    df[played_flag] = False
    save_gog(df)

    return df


def gog_apps_ids(accessToken):
    print("Getting apps owned on GOG...")

    response = requests.get(
        "https://embed.gog.com/user/data/games",
        headers={"Authorization": f"Bearer {accessToken}"},
    )
    gogAppIds = response.json()["owned"]

    print(f"Found {len(gogAppIds)} apps in GOG account.\n")
    return gogAppIds


def enrich_games(gog_game_ids: list[int], access_token: str) -> pd.DataFrame:
    print(
        "Getting game names from the GOG API. This may take a bit longer, the API is slow..."
    )

    games = pd.DataFrame()
    num_undefined = 0
    for gog_game_id in tqdm(
        gog_game_ids,
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} apps processed",
    ):
        # Get the game name from GOG
        # FIXME: 'list' object has no attribute 'get'
        try:
            current_game = gog_game_name(gog_game_id, access_token)
        except Exception as e:
            current_game = None
            print(e)
            print(gog_game_id)
        if len(current_game) == 1:
            games = pd.concat(
                [games, current_game],
                ignore_index=True,
            )
        else:
            num_undefined += 1

    print(
        f"\nFound {len(games)} named games. {num_undefined} apps had no game associated with them. "
        f"These are likely DLC and are not included."
    )

    return games


def gog_game_name(gogGameId, accessToken) -> pd.DataFrame:
    response = requests.get(
        f"https://embed.gog.com/account/gameDetails/{gogGameId}.json",
        headers={"Authorization": f"Bearer {accessToken}"},
    )
    # TODO handle, if yields 404: requests.get(
    #  f"https://embed.gog.com/reviews/product/{gogGameId}.json&page=0",
    #  headers={"Authorization": f"Bearer {accessToken}"},     )

    return pd.DataFrame.from_dict(response.json(), orient="index").transpose()


def gog_access_token(gog_login_code, gog_refresh_token):
    print("Getting/refreshing GOG access token...")

    data = {
        "client_id": "46899977096215655",
        "client_secret": "9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9",
        "redirect_uri": "https://embed.gog.com/on_login_success?origin=client",
    }
    if gog_login_code is not None:
        data.update({"grant_type": "authorization_code", "code": gog_login_code})
    else:
        data.update({"grant_type": "refresh_token", "refresh_token": gog_refresh_token})

    response = requests.post("https://auth.gog.com/token", data=data)
    data = response.json()

    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")

    # TODO: handle: {'error': 'invalid_grant', 'error_description': 'The authorization code has expired'}
    if not access_token or not refresh_token:
        print(
            "Error: Could not fetch GOG access and/or refresh token. The GOG API returned the following response:"
        )
        print(data)
        print(
            "If this keeps happening, try logging in to GOG again and getting a new login code."
        )
        exit(1)

    return access_token, refresh_token


def parse_gog_response(data: dict) -> dict:
    result = {}
    if "products" in data and len(data["products"]) > 0:
        product = data["products"][0]
        result = {
            "gog_id": int(product.get("id", 0)),
            "title": product.get("title", ""),
            "reviewsRating": int(product.get("reviewsRating", 0)),
            "coverVertical": product.get("coverVertical", ""),
            "coverHorizontal": product.get("coverHorizontal", ""),
        }

    return result


def gog_data(game_name: str) -> dict:
    url = (
        f"https://catalog.gog.com/v1/catalog?limit=1&locale=en-US&order=desc:score&page=1"
        f"&productType=in:game,pack,dlc,extras&query=like:{game_name.replace(' ', '+')}"
    )

    payload = {}
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Origin": "https://www.gog.com",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": "https://www.gog.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
    }

    response = requests.request("GET", url, headers=headers, data=payload)

    if response.status_code == 200:
        return parse_gog_response(response.json())
    return {}


def load_and_update_parquet(file_path: str, output_path: str, column: str):
    # Load the parquet file into a DataFrame
    df = pd.read_parquet(file_path)

    # Set the specified column to 0
    df[column] = 0

    # Save the updated DataFrame back to a parquet file
    df.to_parquet(output_path, index=False)


if __name__ == "__main__":
    do_tests = False
    if do_tests:
        gog_games()

    if do_tests:
        # Example usage
        input_file_path = DATA_FILEPATH
        output_file_path = input_file_path
        column_to_update = "gog_id"

        load_and_update_parquet(input_file_path, output_file_path, column_to_update)

    if do_tests:
        # Example usage:
        test_game = "The Witcher 3: Wild Hunt"
        gog_game_id = gog_data(test_game)
        if gog_game_id:
            print(f"The GoG game ID for '{test_game}' is {gog_game_id['gog_id']}.")
        else:
            print(f"Game '{game_name}' not found on GoG.")
