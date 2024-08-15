import os

import pandas as pd
from dotenv import load_dotenv

from src.constants import games_folder, played_flag
from src.gog_parser import parse_gog_file_for_gamelist, save_data
from src.markdown_parser import read_and_filter_markdown
from src.request_rating import request_rating

load_dotenv()


def main():
    file_path = games_folder + "/gog_1"
    df = parse_gog_file_for_gamelist(file_path)
    store_identifier = ""
    df = pd.concat(
        [
            df,
            read_and_filter_markdown(
                os.path.join(
                    os.getenv("MARKDOWN_PATH", ""), "gespielte Computerspiele.md"
                ),
                store_identifier,
                True,
            ),
        ],
        ignore_index=True,
    )
    df["num_reviews"] = 0
    df["review_score"] = 0
    df["total_positive"] = 0
    df["total_negative"] = 0
    df["total_reviews"] = -1
    df["found_game_name"] = ""
    df["app_id"] = 0
    df["rating"] = 0
    df["review_score_desc"] = ""
    df[played_flag] = df[played_flag].astype(bool)
    print(f"Games to cycle: {len(df)}")
    for index, row in df.iterrows():
        df.iloc[index] = request_rating(row)
        save_data(df)


if __name__ == "__main__":
    main()
