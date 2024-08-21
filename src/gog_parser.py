import json

import pandas as pd

from src.constants import game_name, played_flag, store_name
from src.utils import add_columns, init_df


def parse_gog_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

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
    else:
        print("No games found in provided data.")

    return add_columns(df)
