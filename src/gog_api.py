# Description: Utility to find the names of games owned on GOG.
# Based on https://github.com/NikkelM/Steam-App-ID-Finder
import os

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
CONFIG = {
    "refreshToken": os.getenv("refreshToken", None),
    "gogLoginCode": os.getenv("gogLoginCode", None),
    "mode": "gog",
}


def steamAppIDsFromGOGAccount():
    if CONFIG["refreshToken"]:
        accessToken, refreshToken = getGogAccessToken(None, CONFIG["refreshToken"])
    elif CONFIG["gogLoginCode"]:
        accessToken, refreshToken = getGogAccessToken(CONFIG["gogLoginCode"], None)

    print(
        'Writing refresh token to "data/gogRefreshToken.txt". Use this token in the config file to avoid having to '
        "log in next time you run the script.\n"
    )
    with open("data/gogRefreshToken.txt", "w") as f:
        f.write(refreshToken)

    # Get the list of apps owned on GOG
    gogAppIds = getGogApps(accessToken)

    # Get the game names for the corresponding game IDs
    gogGameNames = getGogGameNames(gogAppIds, accessToken)

    print('Writing game names to "data/gogGameNames.txt"')
    with open("data/gogGameNames.txt", "w") as f:
        f.write("\n".join(gogGameNames))


def getGogApps(accessToken):
    print("Getting apps owned on GOG...")

    response = requests.get(
        "https://embed.gog.com/user/data/games",
        headers={"Authorization": f"Bearer {accessToken}"},
    )
    gogAppIds = response.json()["owned"]

    print(f"Found {len(gogAppIds)} apps in GOG account.\n")
    return gogAppIds


def getGogGameNames(gogGameIds, accessToken):
    print(
        "Getting game names from the GOG API. This may take a bit longer, the API is slow..."
    )

    gameNames = []
    numUndefined = 0
    for gogGameId in tqdm(
        gogGameIds,
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} apps processed",
    ):
        # Get the game name from GOG
        # FIXME: 'list' object has no attribute 'get'
        try:
            gameName = getGogGameName(gogGameId, accessToken)
        except Exception as e:
            gameName = None
            print(e)
        if gameName is not None:
            gameNames.append(gameName)
        else:
            numUndefined += 1

    print(
        f"\nFound {len(gameNames)} named games. {numUndefined} apps had no game associated with them. "
        f"These are likely DLC and are not included."
    )

    return gameNames


def getGogGameName(gogGameId, accessToken):
    response = requests.get(
        f"https://embed.gog.com/account/gameDetails/{gogGameId}.json",
        headers={"Authorization": f"Bearer {accessToken}"},
    )
    return response.json().get("title")


def getGogAccessToken(gogLoginCode, gogRefreshToken):
    print("Getting/refreshing GOG access token...")

    data = {
        "client_id": "46899977096215655",
        "client_secret": "9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9",
        "redirect_uri": "https://embed.gog.com/on_login_success?origin=client",
    }
    if gogLoginCode is not None:
        data.update({"grant_type": "authorization_code", "code": gogLoginCode})
    else:
        data.update({"grant_type": "refresh_token", "refresh_token": gogRefreshToken})

    response = requests.post("https://auth.gog.com/token", data=data)
    data = response.json()

    accessToken = data.get("access_token")
    refreshToken = data.get("refresh_token")

    # TODO: handle: {'error': 'invalid_grant', 'error_description': 'The authorization code has expired'}
    if not accessToken or not refreshToken:
        print(
            "Error: Could not fetch GOG access and/or refresh token. The GOG API returned the following response:"
        )
        print(data)
        print(
            "If this keeps happening, try logging in to GOG again and getting a new login code."
        )
        exit(1)

    return accessToken, refreshToken


if __name__ == "__main__":
    steamAppIDsFromGOGAccount()
