import pandas as pd
from dotenv import load_dotenv
from metacritic_scraper import get_metacritic_score
from src.constants import (
    APP_ID,
    HASH,
    METACRITIC_GAME_NAME,
    METACRITIC_SCORE,
    RATING_FIELD,
    game_name,
    played_flag,
    store_name,
    total_reviews,
)
from src.epic_parser import epic_games
from src.gog_api import gog_data, gog_games
from src.request_rating import request_rating, steam_app_ids_matched
from src.steam_api import steam_games
from src.utils import (
    coerce_dataframe_types,
    init_df,
    load_data,
    process_data,
    save_data,
    without_demo_in_name,
)
from steam_family_parser import steam_family_games
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
    df = process_data(df)
    save_data(df)

    df = process_data(df)
    save_data(df)

    print(f"Games to cycle: {df.shape[0]}")
    pbar = tqdm(
        df.iterrows(),
        total=df.shape[0],
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} games processed | {postfix}",
    )
    for index, row in pbar:
        if row[total_reviews] == -1 or row[APP_ID] == 0:
            df.iloc[index] = request_rating(row)

        if row["gog_id"] == 0 and row[APP_ID] == 0:
            gog_response = gog_data(without_demo_in_name(row[game_name]))
            for column, value in gog_response.items():
                df.at[index, column] = value

        # Get Metacritic score
        if row[METACRITIC_SCORE] == 0:
            metacritic_game_name, metacritic_score = get_metacritic_score(row[game_name])
            df.at[index, METACRITIC_SCORE] = metacritic_score
            df.at[index, METACRITIC_GAME_NAME] = metacritic_game_name

        pbar.set_postfix(
            game=df.at[index, game_name],
            value=f"Steam: \t{df.at[index, APP_ID]}\t{round(df.at[index, RATING_FIELD], 3) * 100}\\"
            f"GoG: {df.at[index, 'gog_id']}\\{round(df.at[index, 'reviewsRating'], 1) /10}\\"
            f"MetaCritic:  {df.at[index, METACRITIC_SCORE]}",
        )
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
    # df = update_played_status(df, played_games())
    df = merge_duplicates(df)
    df = process_data(df)
    df = merged_data_sources(df=df, df_loaded=load_data())
    return coerce_dataframe_types(df)


def merge_duplicates(df):
    duplicated_mask = df.duplicated(subset=[game_name, store_name], keep="first")
    return df[~duplicated_mask]


def games_from_stores(df):
    sources = [gog_games, steam_games, epic_games, steam_family_games]
    for source in sources:
        df = concat_if_new(df, source())
    return df


if __name__ == "__main__":
    game_ratings()
