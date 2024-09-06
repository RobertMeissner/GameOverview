# Description: Utility to find the names of games owned on Epic Games.
# Based on https://github.com/NikkelM/Steam-App-ID-Finder
import os

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
CONFIG = {
    "epicGamesCookie": f"EPIC_BEARER_TOKEN={os.getenv('EPIC_BEARER_TOKEN')}",
    "mode": "epic",
}


def getEpicGamesGames():
    print('Running in "epicGamesAccount" mode.\n')

    pageNumber = 1
    games = []

    print("Fetching games from Epic Games account...")

    try:
        firstPage = getFirstPage()
    except Exception as error:
        print(
            "\nError fetching games from Epic Games account. "
            'Please check/refresh the "epicGamesCookie" in the configuration file and try again.'
        )
        print(error)
        exit(1)

    for game in firstPage["orders"]:
        games.append(game["items"][0]["description"])

    lastCreatedAt = firstPage["orders"][-1]["createdAtMillis"]
    totalItemsApproximation = firstPage["total"]

    for _ in tqdm(
        range(totalItemsApproximation),
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} games processed",
    ):
        page = getPage(pageNumber, lastCreatedAt)

        # No more games
        if len(page["orders"]) == 0:
            break

        for game in page["orders"]:
            if game["items"][0]["status"] != "REFUNDED":
                games.append(game["items"][0]["description"])

        lastCreatedAt = page["orders"][-1]["createdAtMillis"]

        pageNumber += 1

    # Write the game names to a file
    print('\nWriting game names to "data/epicGamesGameNames.txt"')
    with open("data/epicGamesGameNames.txt", "w") as f:
        f.write("\n".join(games))


def getPage(pageNumber, lastCreatedAt):
    response = requests.get(
        f"https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?page={pageNumber}&"
        f"lastCreatedAt={lastCreatedAt}&locale=en-US",
        headers={"cookie": CONFIG["epicGamesCookie"]},
    )
    return response.json()


def getFirstPage():
    response = requests.get(
        "https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?locale=en-US",
        headers={"cookie": CONFIG["epicGamesCookie"]},
    )
    return response.json()


if __name__ == "__main__":
    getEpicGamesGames()
