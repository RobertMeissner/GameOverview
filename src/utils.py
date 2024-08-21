import pandas as pd

from src.constants import (
    APP_ID,
    DATA_FILEPATH,
    HIDE_FIELD,
    URL,
    game_name,
    played_flag,
    store_name,
    total_reviews,
)


def add_columns(df) -> pd.DataFrame:
    df["num_reviews"] = 0
    df["review_score"] = 0
    df["total_positive"] = 0
    df["total_negative"] = 0
    df[total_reviews] = -1
    df["found_game_name"] = ""
    df["app_id"] = 0
    df["rating"] = 0
    df["review_score_desc"] = ""
    df["hide"] = False
    df["hide"] = df["hide"].astype(bool)
    df[played_flag] = df[played_flag].astype(bool)
    df[URL] = ""
    df[URL] = df[URL].astype(str)
    return df


def init_df():
    df = pd.DataFrame(columns=[game_name, store_name, played_flag, APP_ID])
    df[played_flag] = df[played_flag].astype(bool)
    df[store_name] = df[store_name].astype(str)
    df[game_name] = df[game_name].astype(str)
    df[APP_ID] = df[APP_ID].astype(str)
    return df


def load_data(filename=DATA_FILEPATH) -> pd.DataFrame:
    df = pd.read_parquet(filename)
    df[HIDE_FIELD].fillna(False, inplace=True)
    return df


base_steam_url = "https://store.steampowered.com/app/"


def process_data(df: pd.DataFrame) -> pd.DataFrame:
    # Adding a new column with URL
    df[URL] = df[APP_ID].apply(lambda x: f"{base_steam_url}{x}")
    return df
