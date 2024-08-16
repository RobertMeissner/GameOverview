import os

import pandas as pd
from dotenv import load_dotenv

from src.constants import games_folder, total_reviews, DATA_FILEPATH
from src.epic_parser import parse_epic_file_for_gamelist
from src.gog_parser import parse_gog_file_for_gamelist
from src.markdown_parser import read_and_filter_markdown
from src.request_rating import request_rating
from src.utils import init_df, load_data

load_dotenv()


def save_data(df: pd.DataFrame, filename=games_folder + "/" + "data.parquet"):
    df.to_parquet(filename)

def main():

    if os.path.exists(DATA_FILEPATH):
        df = load_data()
    else:
        df = init_df()

    file_path = games_folder + "/gog_1"
    df_gog = parse_gog_file_for_gamelist(file_path)
    df = pd.concat(
        [
            df, df_gog
        ],
        ignore_index=True,
    )

    store_identifier = ""
    df_old = read_and_filter_markdown(
        os.path.join(
            os.getenv("MARKDOWN_PATH", ""), "gespielte Computerspiele.md"
        ),
        store_identifier,
        True,
    ),
    df = pd.concat(
        [
            df, df_old[0] # FIXMe: why is df_old a tuple?

        ],
        ignore_index=True,
    )

    file_path = games_folder + "/epic.html"
    df_epic = parse_epic_file_for_gamelist(file_path)
    df = pd.concat(
        [
            df, df_epic
        ],
        ignore_index=True,
    )

    print(f"Games to cycle: {len(df)}")
    for index, row in df.iterrows():
        if row[total_reviews] == -1:
            df.iloc[index] = request_rating(row)
            save_data(df)

    save_data(df)


if __name__ == "__main__":
    main()

