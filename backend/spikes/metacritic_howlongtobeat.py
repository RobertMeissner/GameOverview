import os

import pandas as pd
import pyarrow.parquet as pq
import requests
from constants import (
    DATA_FILEPATH,
    HLTB_MAIN_STORY,
    MC_HLTB_RATIO,
    METACRITIC_SCORE,
    game_name,
    played_flag,
)
from dotenv import load_dotenv
from metacritic_scraper import GameDataScraper
from utils import process_data, save_data

# search_url = f"https://www.metacritic.com/search/{quote(game_name)}/"
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
# }
#
# # HowLongToBeat search endpoint
# search_url = "https://howlongtobeat.com/api/search"
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
#     'Content-Type': 'application/json'
# }
#
# search_data = {
#     "searchType": "games",
#     "searchTerms": [game_name.split()],
#     "searchPage": 1,
#     "size": 20
# }
#


load_dotenv()

rawg_key = os.getenv("RAWG_KEY", "")
scraper = GameDataScraper()


def get_metacritic_score(game_name: str) -> int:
    try:
        response = requests.get(
            "https://api.rawg.io/api/games",
            params={"search": game_name, "page_size": 1, "key": rawg_key},
            timeout=10,
        )
        data = response.json()
        ms = data["results"][0]["metacritic"]
        if ms is None:
            return 0
        return ms
    except Exception:
        return 0


def value_for_time_ratio(row: pd.Series) -> tuple[int, int]:
    main_story = 0
    try:
        hltb_entry = scraper.get_howlongtobeat_data(row[game_name])
        main_story = hltb_entry.main_story
        if not main_story:
            main_story = 0
    except Exception:
        pass

    ms = get_metacritic_score(row[game_name])
    return ms, main_story


def filter_df(df: pd.DataFrame, column: str, condition: bool = False) -> pd.DataFrame:
    return df[condition & (df[column] is True)]


if __name__ == "__main__":

    df = pq.read_pandas(os.path.join(DATA_FILEPATH)).to_pandas()

    filtered_df = filter_df(df, played_flag, False)
    df[METACRITIC_SCORE] = 0
    df[HLTB_MAIN_STORY] = 0
    df[MC_HLTB_RATIO] = 0

    for idx, row in df.iterrows():
        print(f"Processing: {row[game_name]}", end="")
        if df.at[idx, METACRITIC_SCORE] != 0:
            print(f" - {round(df.at[idx, MC_HLTB_RATIO], 2)}")
            continue

        ms, main_story = value_for_time_ratio(row)
        df.at[idx, METACRITIC_SCORE] = ms
        df.at[idx, HLTB_MAIN_STORY] = main_story
        if main_story > 0:
            print(ms / main_story)
            df.at[idx, MC_HLTB_RATIO] = ms / main_story
            print(f" - {round(df.at[idx, MC_HLTB_RATIO], 2)}")
        else:
            print(" - 0.")
        df = process_data(df)
        save_data(df)

# After Loading and sorting
# sorted_df = df.sort_values(by="mc_hltb_ratio")
# for _, row in sorted_df.iterrows():
#    print(f"{row['name']}: {row['mc_hltb_ratio']:.2f}")
