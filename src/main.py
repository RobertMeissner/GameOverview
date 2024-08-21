import os

import pandas as pd
from dotenv import load_dotenv

from src.constants import games_folder, total_reviews, DATA_FILEPATH, game_name, APP_ID
from src.epic_parser import parse_epic_file_for_gamelist
from src.gog_parser import parse_gog_file_for_gamelist
from src.markdown_parser import read_and_filter_markdown
from src.request_rating import request_rating
from src.steam_parser import parse_steam_file_for_gamelist
from src.utils import init_df, load_data, process_data

load_dotenv()

rerun = False

def save_data(df: pd.DataFrame, filename=games_folder + "/" + "data.parquet"):
    df.to_parquet(filename)

def concat_if_new(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    # Filter df2 to include only names not in df1
    mask = ~df2[game_name].isin(df1[game_name])
    return pd.concat([df1, df2[mask]], ignore_index=True)

def merge_if_app_id(df: pd.DataFrame, df_new: pd.DataFrame) -> pd.DataFrame:
    df2_filtered = df_new[df_new[APP_ID] != 0]  # Filter out rows in df2 where 'app_id' is 0
    merged_df = pd.merge(df, df2_filtered, on='name')  # Merge df1 and df2_filtered on 'name'


def main():

    if os.path.exists(DATA_FILEPATH):
        df = load_data()
    else:
        df = init_df()
        df = store_data(df)


    print(f"Games to cycle: {len(df)}")
    for index, row in df.iterrows():
        if row[total_reviews] == -1:
            df.iloc[index] = request_rating(row)
            df = process_data(df)
            save_data(df)

    df = process_data(df)
    save_data(df)


def store_data(df):
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
    file_path = games_folder + "/steam"
    df_steam = parse_steam_file_for_gamelist(file_path)
    df = pd.concat(
        [
            df, df_steam
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
    df.drop('app_id_md', axis=1, inplace=True)
    return df


if __name__ == "__main__":
    main()

