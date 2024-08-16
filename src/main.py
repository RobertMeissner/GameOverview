import os

import pandas as pd
from dotenv import load_dotenv

from src.constants import games_folder, total_reviews, DATA_FILEPATH, game_name
from src.epic_parser import parse_epic_file_for_gamelist
from src.gog_parser import parse_gog_file_for_gamelist
from src.markdown_parser import read_and_filter_markdown
from src.request_rating import request_rating
from src.utils import init_df, load_data

load_dotenv()

rerun = False

def save_data(df: pd.DataFrame, filename=games_folder + "/" + "data.parquet"):
    df.to_parquet(filename)

def concat_if_new(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    # Filter df2 to include only names not in df1
    mask = ~df2[game_name].isin(df1[game_name])
    return pd.concat([df1, df2[mask]], ignore_index=True)

def main():

    if os.path.exists(DATA_FILEPATH):
        df = load_data()
    else:
        df = init_df()

    file_path = games_folder + "/gog_1"
    df_gog = parse_gog_file_for_gamelist(file_path)
    df = concat_if_new(df, df_gog)
    df = pd.concat(
        [
            df, df_gog
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

    store_identifier = "unknown"
    df_played = read_and_filter_markdown(
        os.path.join(
            os.getenv("MARKDOWN_PATH", ""), "gespielte Computerspiele.md"
        ),
        store_identifier,
        True,
    ),

    # Merging df1 and df2 on 'name' while updating 'played' from df2 where names match
    df = df.merge(df_played[0], on='name', how='left', suffixes=('', '_md'))
    df.loc[df['played_md'] == True, 'played'] = True

    # Dropping the original 'played_x' column from df1
    df.drop('played_md', axis=1, inplace=True)
    df.drop('store_md', axis=1, inplace=True)

    print(f"Games to cycle: {len(df)}")
    for index, row in df.iterrows():
        if row[total_reviews] == -1:
            df.iloc[index] = request_rating(row)
            save_data(df)

    save_data(df)


if __name__ == "__main__":
    main()

