import pandas as pd

from backend.src.constants import game_name, played_flag, store_name
from backend.src.utils import init_df


def parse_steam_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

    with open(file_path) as file:
        data = file.readlines()

    for line in data:
        line = line.replace("\n", "")
        if line:
            df = pd.concat(
                [
                    df,
                    pd.DataFrame(
                        [
                            {
                                game_name: line.strip(),
                                store_name: "steam",
                                played_flag: False,
                            }
                        ]
                    ),
                ],
                ignore_index=True,
            )
    return df


if __name__ == "__main__":
    df = parse_steam_file_for_gamelist("data/steam")
    print(df.head())
