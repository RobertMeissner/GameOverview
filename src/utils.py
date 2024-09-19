import hashlib

import pandas as pd

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    DATA_FILEPATH,
    HASH,
    HIDE_FIELD,
    URL,
    game_name,
    played_flag,
    store_name,
    total_reviews, review_score, RATING_FIELD,
)


def add_columns(df) -> pd.DataFrame:
    df["num_reviews"] = 0
    df["review_score"] = 0
    df["total_positive"] = 0
    df["total_negative"] = 0
    df[total_reviews] = -1
    df["found_game_name"] = ""
    df[APP_ID] = 0
    df[APP_ID] = df[APP_ID].astype(int)
    df["rating"] = 0
    df["review_score_desc"] = ""
    df[HIDE_FIELD] = False
    df[HIDE_FIELD] = df[HIDE_FIELD].astype(bool)
    df[played_flag] = df[played_flag].astype(bool)
    df[URL] = ""
    df[URL] = df[URL].astype(str)
    df[CORRECTED_APP_ID] = 0
    df[CORRECTED_APP_ID] = df[CORRECTED_APP_ID].astype(int)
    return df


expected_structure = {game_name: pd.StringDtype(),
                      HASH: pd.StringDtype(),
                      store_name: pd.StringDtype(),
                      played_flag: pd.BooleanDtype(),
                      APP_ID: pd.StringDtype(),
                      'backgroundImage': pd.StringDtype(),
                      'cdKey': pd.StringDtype(),
                      'textInformation': pd.StringDtype(),
                      'downloads': pd.StringDtype(),
                      'galaxyDownloads': pd.StringDtype(),
                      'extras': pd.StringDtype(),
                      'dlcs': pd.StringDtype(),
                      'tags': pd.StringDtype(),
                      'isPreOrder': pd.StringDtype(),
                      'releaseTimestamp': pd.Int64Dtype(),
                      'messages': pd.StringDtype(),
                      'changelog': pd.StringDtype(),
                      'forumLink': pd.StringDtype(),
                      'isBaseProductMissing': pd.StringDtype(),
                      'missingBaseProduct': pd.StringDtype(),
                      'features': pd.StringDtype(),
                      'simpleGalaxyInstallers': pd.StringDtype(),
                      'num_reviews': pd.Int64Dtype(),
                      review_score: pd.Int64Dtype(),
                      'total_positive': pd.Int64Dtype(),
                      'total_negative': pd.Int64Dtype(),
                      'total_reviews': pd.Int64Dtype(),
                      'found_game_name': pd.StringDtype(),
                      RATING_FIELD: pd.Int64Dtype(),
                      'review_score_desc': pd.StringDtype(),
                      HIDE_FIELD: pd.StringDtype(),
                      URL: pd.StringDtype(),
                      'corrected_app_id': pd.Int64Dtype(),
                      'playtime_forever': pd.Int64Dtype(),
                      'img_icon_url': pd.StringDtype(),
                      'has_community_visible_stats': pd.StringDtype(),
                      'playtime_windows_forever': pd.Int64Dtype(),
                      'playtime_mac_forever': pd.Int64Dtype(),
                      'playtime_linux_forever': pd.Int64Dtype(),
                      'playtime_deck_forever': pd.Int64Dtype(),
                      'rtime_last_played': pd.Int64Dtype(),
                      'playtime_disconnected': pd.Int64Dtype(),
                      'has_leaderboards': pd.StringDtype(),
                      'content_descriptorids': pd.StringDtype(),
                      'playtime_2weeks': pd.Int64Dtype()}


def coerce_dataframe_types(df: pd.DataFrame, expected_structure: dict) -> pd.DataFrame:
    for col, expected_dtype in expected_structure.items():
        df[col] = df[col].astype(expected_dtype)
    return df


def init_df():
    return coerce_dataframe_types(pd.DataFrame( {col: pd.Series([], dtype=dtype) for col, dtype in expected_structure.items()}), expected_structure)


def load_data(filename=DATA_FILEPATH) -> pd.DataFrame:
    return pd.read_parquet(filename)


base_steam_url = "https://store.steampowered.com/app/"


def process_data(df: pd.DataFrame) -> pd.DataFrame:
    # Adding a new column with URL
    df[URL] = df[APP_ID].apply(lambda x: f"{base_steam_url}{x}")
    return game_hash(df)


# Function to create a hash
def create_hash(row: pd.Series) -> str:
    combined = row[game_name] + row[store_name]
    return hashlib.md5(combined.encode()).hexdigest()


def game_hash(df: pd.DataFrame) -> pd.DataFrame:
    df[HASH] = df.apply(create_hash, axis=1)
    return df


def save_data(df: pd.DataFrame, filename=DATA_FILEPATH):
    df.to_parquet(filename)


if __name__ == "__main__":
    df = load_data()
    df = game_hash(df)
    save_data(df)
