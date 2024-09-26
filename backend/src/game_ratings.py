import pandas as pd
from dotenv import load_dotenv
from src.constants import (
    APP_ID,
    HASH,
    game_name,
    played_flag,
    store_name,
    total_reviews,
)
from src.epic_parser import epic_games
from src.gog_api import gog_games
from src.markdown_parser import played_games
from src.request_rating import request_rating, steam_app_ids_matched
from src.steam_api import steam_games
from src.utils import (
    coerce_dataframe_types,
    init_df,
    load_data,
    process_data,
    save_data,
)
from tqdm import tqdm

load_dotenv()

rerun = True


def concat_if_new(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    mask = ~df2[game_name].isin(df1[game_name])
    return pd.concat([df1, df2[mask]], ignore_index=True)


def game_ratings():
    df = init_df()
    df = games_from_accounts(df)

    df = steam_app_ids_matched(df)
    save_data(df)

    print(f"Games to cycle: {df.shape[0]}")
    for index, row in tqdm(
        df.iterrows(),
        total=df.shape[0],
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} games processed",
    ):
        if row[total_reviews] == -1 or row[APP_ID] == 0:
            df.iloc[index] = request_rating(row)
            df = process_data(df)
            save_data(df)

    df = process_data(df)
    save_data(df)


def update_played_status(df: pd.DataFrame, games_list: list) -> pd.DataFrame:
    if played_flag not in df.columns:
        df[played_flag] = False

    df.loc[df[game_name].isin(games_list), played_flag] = True

    existing_games = set(df[game_name])
    new_games = [game for game in games_list if game not in existing_games]
    if new_games:
        new_rows = pd.DataFrame(
            {
                game_name: new_games,
                store_name: [""] * len(new_games),
                played_flag: [True] * len(new_games),
                APP_ID: [0] * len(new_games),
            }
        )
        df = pd.concat([df, new_rows], ignore_index=True)

    return coerce_dataframe_types(df)


def merged_data_sources(df: pd.DataFrame, df_loaded: pd.DataFrame) -> pd.DataFrame:
    df_combined = pd.concat([df_loaded, df], ignore_index=True)
    df_merged = df_combined.drop_duplicates(subset=HASH, keep="first")
    df_merged.reset_index(drop=True, inplace=True)
    return df_merged


def games_from_accounts(df):
    df = games_from_stores(df)
    df = update_played_status(df, played_games())
    df = merge_duplicates(df)
    df = process_data(df)
    df = merged_data_sources(df=df, df_loaded=load_data())
    return coerce_dataframe_types(df)


def merge_duplicates(df):
    duplicated_mask = df.duplicated(subset=[game_name, store_name], keep="first")
    return df[~duplicated_mask]


def games_from_stores(df):
    sources = [gog_games, steam_games, epic_games]
    for source in sources:
        df = concat_if_new(df, source())
    return df


if __name__ == "__main__":
    game_ratings()
