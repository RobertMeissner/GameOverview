# Description: Utility to find Steam App IDs from a list of game names.
# Based on https://github.com/NikkelM/Steam-App-ID-Finder

import difflib
import json

import requests
from tqdm import tqdm

CONFIG = {}  # Define your CONFIG here

# ----- Input -----


def load_input_game_names():
    if CONFIG["inputFile"]["fileType"] not in ["csv", "txt"]:
        print(
            f"Error: Input file type not supported: {CONFIG['inputFile']['fileType']}."
        )
        exit(1)

    try:
        with open(
            f"{CONFIG['inputFile']['fileName']}.{CONFIG['inputFile']['fileType']}") as file:
            game_names = file.read()
    except Exception as e:
        print("Error: Could not read input file.")
        print(e)
        exit(1)

    return game_names.split(CONFIG["inputFile"]["delimiter"])


def fetch_steam_apps():
    response = requests.get("https://api.steampowered.com/ISteamApps/GetAppList/v2/")
    data = response.json()
    return data["applist"]["apps"]


# ----------- Main -----------


def steam_app_ids_from_game_names():
    print('Running in "gameNames" mode.\n')

    # Fetch Steam games from API
    steam_apps = fetch_steam_apps()
    print(f"Found {len(steam_apps)} games in Steam's database.")

    # Import the game names from the input file
    game_names = load_input_game_names()
    print(
        f"The input file ({CONFIG['inputFile']['fileName']}.{CONFIG['inputFile']['fileType']}) contained "
        f"{len(game_names)} game names.\n"
    )

    # Find Steam App ID's for full matches
    (
        steam_ids_single_full_match,
        steam_ids_multiple_full_matches,
        remaining_game_names,
    ) = find_steam_app_ids_full_match(game_names, steam_apps)
    game_names = remaining_game_names

    # Save the full matches to .json files
    if len(steam_ids_single_full_match) > 0:
        print(
            f"Writing game names and Steam App ID's for games with one full match to "
            f"\"output/{CONFIG['mode']}/steamAppIds_fullMatches.json\"..."
        )
        with open(
            f"./output/{CONFIG['mode']}/steamAppIds_fullMatches.json", "w"
        ) as file:
            json.dump(steam_ids_single_full_match, file, indent=2)
    if len(steam_ids_multiple_full_matches) > 0:
        print(
            f"Writing game names and Steam App ID's for games with multiple full matches to "
            f"\"output/{CONFIG['mode']}/steamAppIds_multipleFullMatches.json\"..."
        )
        with open(
            f"./output/{CONFIG['mode']}/steamAppIds_multipleFullMatches.json", "w"
        ) as file:
            json.dump(steam_ids_multiple_full_matches, file, indent=2)
    print()

    if not CONFIG["onlyFullMatches"]:
        # Find Steam App ID's for best matches
        steam_ids_best_match, steam_ids_no_match = find_steam_app_ids_best_match(
            game_names, steam_apps
        )

        # Save the best matches to a .json file
        print(
            f"\nWriting game names and Steam App ID's for partial matches to"
            f" \"output/{CONFIG['mode']}/steamAppIds_bestMatch.json\"..."
        )
        with open(f"./output/{CONFIG['mode']}/steamAppIds_bestMatch.json", "w") as file:
            json.dump(steam_ids_best_match, file, indent=2)

        if len(steam_ids_no_match) > 0:
            print(
                f"Writing the names of the remaining {len(steam_ids_no_match)} games for which no satisfying match "
                f"was found to \"output/{CONFIG['mode']}/steamAppIds_noMatch.json\"..."
            )
            with open(
                f"./output/{CONFIG['mode']}/steamAppIds_noMatch.json", "w"
            ) as file:
                json.dump(steam_ids_no_match, file, indent=2)


# ---------- ID matching ----------


def find_steam_app_ids_full_match(game_names, steam_apps):
    print("Searching for full matches...")

    steam_ids_single_full_match = {}
    steam_ids_multiple_full_matches = {}
    remaining_game_names = []

    for game in game_names:
        # Get and de-duplicate matches. One game can be in the database multiple times with the same appid
        full_matches = list(
            {app["appid"] for app in steam_apps if app["name"] == game}
        )

        if len(full_matches) == 1:
            steam_ids_single_full_match[game] = full_matches[0]
        elif len(full_matches) > 1:
            # More than one match for this game was found, save all matches
            steam_ids_multiple_full_matches[game] = full_matches
        else:
            # No full match was found for this game
            remaining_game_names.append(game)

    print(
        f"Found full matches for {len(steam_ids_single_full_match) + len(steam_ids_multiple_full_matches)} "
        f"games{len(steam_ids_multiple_full_matches) > 1 }"
        f", of which {len(steam_ids_multiple_full_matches)} games had more than one match."
    )

    return (
        steam_ids_single_full_match,
        steam_ids_multiple_full_matches,
        remaining_game_names,
    )


def find_steam_app_ids_best_match(game_names, steam_apps):
    partial_match_threshold = 0
    if CONFIG["partialMatchThreshold"]:
        partial_match_threshold = CONFIG["partialMatchThreshold"]

    print(
        f"Searching for partial matches with a similarity score >={partial_match_threshold} for the remaining "
        f"{len(game_names)} games..."
    )

    # Convert to lowercase to make matches case insensitive and thereby more accurate
    steam_apps_lowercase = [app["name"].lower() for app in steam_apps]
    game_names_lowercase = [game.lower() for game in game_names]

    # For all games we couldn't get a full match, find the most similar title
    steam_ids_best_match = {}
    steam_ids_no_match = []

    for i in tqdm(range(len(game_names_lowercase))):
        best_match = difflib.get_close_matches(
            game_names_lowercase[i],
            steam_apps_lowercase,
            n=1,
            cutoff=partial_match_threshold,
        )
        if best_match:
            steam_ids_best_match[game_names[i]] = {
                "appId": steam_apps[steam_apps_lowercase.index(best_match[0])]["appid"],
                "similarity": difflib.SequenceMatcher(
                    None, game_names_lowercase[i], best_match[0]
                ).ratio(),
                "steamName": steam_apps[steam_apps_lowercase.index(best_match[0])][
                    "name"
                ],
            }
        else:
            # The similarity score is too low
            steam_ids_no_match.append(game_names[i])

    # Sort the matches by similarity score
    steam_ids_best_match = dict(
        sorted(
            steam_ids_best_match.items(),
            key=lambda item: item[1]["similarity"],
            reverse=True,
        )
    )

    print(
        f"Found partial matches with a similarity score >={partial_match_threshold} for "
        f"{len(steam_ids_best_match)} games."
    )

    return steam_ids_best_match, steam_ids_no_match


# TODO Check this


def find_closest_matches(name, names_dict, n=3):
    # Get a list of names from the dictionary
    names_list = list(names_dict.keys())

    # Use difflib to find the closest matches
    closest_matches = difflib.get_close_matches(name, names_list, n=n)

    return closest_matches
