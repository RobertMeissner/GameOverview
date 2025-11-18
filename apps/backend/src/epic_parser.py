import json

import pandas as pd
from src.constants import DATA_FOLDER, game_name, played_flag, store_name
from src.utils import coerce_dataframe_types, init_df


def parse_epic_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

    with open(file_path) as file:
        data = json.load(file)

    new_rows = []
    game_key = "games"
    if game_key in data:
        for game in data[game_key]:
            new_rows.append({game_name: game, store_name: "epic", played_flag: False})

    new_df = pd.DataFrame(new_rows)
    return coerce_dataframe_types(pd.concat([df, new_df], ignore_index=True))


def epic_games():
    return parse_epic_file_for_gamelist(DATA_FOLDER + "/epic_console_log.json")


if __name__ == "__main__":
    df = epic_games()
    print(df.head())
