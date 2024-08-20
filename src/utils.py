import pandas as pd

from src.constants import played_flag, total_reviews, game_name, store_name, DATA_FILEPATH, HIDE_FIELD, app_id


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
    return df


def init_df():
    df = pd.DataFrame(columns=[game_name, store_name, played_flag])
    df[played_flag] = df[played_flag].astype(bool)
    df[store_name] = df[store_name].astype(str)
    df[game_name] = df[game_name].astype(str)
    df[app_id] = df[app_id].astype(str)
    return df


def load_data(filename=DATA_FILEPATH) -> pd.DataFrame:

    print("loading raw")
    df = pd.read_parquet(filename)
    df[HIDE_FIELD].fillna(False, inplace=True)

    return df
