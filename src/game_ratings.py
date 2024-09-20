import os

import pandas as pd
from dotenv import load_dotenv
from tqdm import tqdm

from src.constants import (
    CORRECTED_APP_ID,
    DATA_FILEPATH,
    game_name,
    played_flag,
    total_reviews,
)
from src.epic_parser import epic_games
from src.gog_api import gog_games
from src.markdown_parser import played_games
from src.request_rating import request_rating
from src.steam_api import steam_games
from src.utils import init_df, load_data, process_data, save_data

load_dotenv()

rerun = True


def concat_if_new(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    # Filter df2 to include only names not in df1
    mask = ~df2[game_name].isin(df1[game_name])
    return pd.concat([df1, df2[mask]], ignore_index=True)


def game_ratings():
    if not rerun and os.path.exists(DATA_FILEPATH):
        df = load_data()
    else:
        df = init_df()
        df = games_from_accounts(df)

    print(f"Games to cycle: {df.shape[0]}")
    for index, row in tqdm(
        df.iterrows(),
        total=df.shape[0],
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} games processed",
    ):
        if row[total_reviews] == -1 or row[CORRECTED_APP_ID] != 0:
            df.iloc[index] = request_rating(row)
            df = process_data(df)
            save_data(df)

    # df = process_data(df)
    # save_data(df)


def update_played_status(df: pd.DataFrame, games_list: list) -> pd.DataFrame:
    if played_flag not in df.columns:
        df[played_flag] = False

    # Use `isin` to find games in the list and update 'played' column
    df.loc[df[played_flag].isin(games_list), played_flag] = True

    return df


def games_from_accounts(df):
    df = games_from_stores(df)
    return update_played_status(df, played_games())


def games_from_stores(df):
    sources = [gog_games, steam_games, epic_games]
    for source in sources:
        df = concat_if_new(df, source())
    return df


if __name__ == "__main__":
    game_ratings()
