import hashlib

import pandas as pd
from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    DATA_FILEPATH,
    HASH,
    HIDE_FIELD,
    RATING_FIELD,
    URL,
    game_name,
    played_flag,
    review_score,
    store_name,
    total_reviews,
)

EXPECTED_DF_COLUMNS = {
    game_name: pd.StringDtype(),
    HASH: pd.StringDtype(),
    store_name: pd.StringDtype(),
    played_flag: pd.BooleanDtype(),
    APP_ID: pd.Int64Dtype(),
    "backgroundImage": pd.StringDtype(),
    "cdKey": pd.StringDtype(),
    "textInformation": pd.StringDtype(),
    "downloads": pd.StringDtype(),
    "galaxyDownloads": pd.StringDtype(),
    "extras": pd.StringDtype(),
    "dlcs": pd.StringDtype(),
    "tags": pd.StringDtype(),
    "isPreOrder": pd.StringDtype(),
    "releaseTimestamp": pd.Int64Dtype(),
    "messages": pd.StringDtype(),
    "changelog": pd.StringDtype(),
    "forumLink": pd.StringDtype(),
    "isBaseProductMissing": pd.StringDtype(),
    "missingBaseProduct": pd.StringDtype(),
    "features": pd.StringDtype(),
    "simpleGalaxyInstallers": pd.StringDtype(),
    "num_reviews": pd.Int64Dtype(),
    review_score: pd.Int64Dtype(),
    "total_positive": pd.Int64Dtype(),
    "total_negative": pd.Int64Dtype(),
    "total_reviews": pd.Int64Dtype(),
    "found_game_name": pd.StringDtype(),
    RATING_FIELD: pd.Float32Dtype(),
    "review_score_desc": pd.StringDtype(),
    HIDE_FIELD: pd.BooleanDtype(),
    URL: pd.StringDtype(),
    "corrected_app_id": pd.Int64Dtype(),
    "playtime_forever": pd.Int64Dtype(),
    "img_icon_url": pd.StringDtype(),
    "has_community_visible_stats": pd.StringDtype(),
    "playtime_windows_forever": pd.Int64Dtype(),
    "playtime_mac_forever": pd.Int64Dtype(),
    "playtime_linux_forever": pd.Int64Dtype(),
    "playtime_deck_forever": pd.Int64Dtype(),
    "rtime_last_played": pd.Int64Dtype(),
    "playtime_disconnected": pd.Int64Dtype(),
    "has_leaderboards": pd.StringDtype(),
    "content_descriptorids": pd.StringDtype(),
    "playtime_2weeks": pd.Int64Dtype(),
}


def coerce_dataframe_types(
    df: pd.DataFrame, expected_columns: dict = None
) -> pd.DataFrame:
    if expected_columns is None:
        expected_columns = EXPECTED_DF_COLUMNS

    for col, expected_dtype in expected_columns.items():
        df[col] = df[col].astype(expected_dtype)
    return df


def init_df():
    return pd.DataFrame(
        {col: pd.Series([], dtype=dtype) for col, dtype in EXPECTED_DF_COLUMNS.items()}
    )


def load_data(filename=DATA_FILEPATH) -> pd.DataFrame:
    return pd.read_parquet(filename)


base_steam_url = "https://store.steampowered.com/app/"


def process_data(df: pd.DataFrame) -> pd.DataFrame:
    df[URL] = df[APP_ID].apply(lambda x: f"{base_steam_url}{x}")

    columns_to_fill_with_zero = [
        APP_ID,
        review_score,
        RATING_FIELD,
        "num_reviews",
        CORRECTED_APP_ID,
        "total_positive",
        "total_negative",
    ]
    df[columns_to_fill_with_zero] = df[columns_to_fill_with_zero].fillna(0)

    columns_to_fill_with_minus_1 = [total_reviews]
    df[columns_to_fill_with_minus_1] = df[columns_to_fill_with_minus_1].fillna(-1)

    columns_to_fill_with_empty = ["found_game_name", "review_score_desc"]
    df[columns_to_fill_with_empty] = df[columns_to_fill_with_empty].fillna("")

    columns_to_fill_with_false = [HIDE_FIELD]
    df[columns_to_fill_with_false] = df[columns_to_fill_with_false].fillna(False)
    return coerce_dataframe_types(game_hash(df))


# Function to create a hash
def create_hash(row: pd.Series) -> str:
    combined = row[game_name] + row[store_name]
    return hashlib.md5(combined.encode()).hexdigest()


def game_hash(df: pd.DataFrame) -> pd.DataFrame:
    df[HASH] = df.apply(create_hash, axis=1)
    return df


def save_data(df: pd.DataFrame, filename=DATA_FILEPATH):
    coerce_dataframe_types(df).to_parquet(filename)


if __name__ == "__main__":
    df = load_data()
    df = game_hash(df)
    save_data(df)
