import json

import pandas as pd

from src.constants import game_name, games_folder, played_flag, store_name


def parse_gog_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = pd.DataFrame(columns=[game_name, store_name, played_flag])
    df[played_flag] = df[played_flag].astype(bool)
    df[store_name] = df[store_name].astype(str)
    df[game_name] = df[game_name].astype(str)

    with open(file_path, "r") as file:
        data = file.read()

    # First, isolate the JSON portion by splitting the string where data starts
    json_data = data.split("var gogData = ", 1)[1]
    # Remove trailing characters if necessary
    json_data = json_data.strip()[:-1]  # Removing trailing semicolon if present

    # Parse JSON Data
    try:
        gog_data = json.loads(json_data)
    except json.JSONDecodeError as e:
        print("Error parsing JSON:", e)
        gog_data = None

    if gog_data and "accountProducts" in gog_data:
        account_products = gog_data["accountProducts"]
        # Extract the game titles

        for name in account_products:
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        [
                            {
                                game_name: name["title"].strip(),
                                store_name: "gog",
                                played_flag: False,
                            }
                        ]
                    ),
                ],
                ignore_index=True,
            )
        print("Game Titles:", df.info())
        return df
    else:
        print("No games found in provided data.")


def save_data(df: pd.DataFrame, filename=games_folder + "/" + "data.parquet"):
    df.to_parquet(filename)
