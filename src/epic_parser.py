import pandas as pd
from bs4 import BeautifulSoup

from src.constants import game_name, games_folder, played_flag, store_name
from src.utils import coerce_dataframe_types, init_df


def parse_epic_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

    with open(file_path) as file:
        data = file.read()

    soup = BeautifulSoup(data, "html.parser")
    filtered_items = soup.find_all("a", class_="am-1xcu1kd")

    new_rows = []
    for item in filtered_items:
        name = item.find("span").find("span").text.strip()
        new_rows.append({game_name: name, store_name: "epic", played_flag: False})

    new_df = pd.DataFrame(new_rows)
    return coerce_dataframe_types(pd.concat([df, new_df], ignore_index=True))


def epic_games():
    return parse_epic_file_for_gamelist(games_folder + "/epic.html")


if __name__ == "__main__":
    df = epic_games()
    print(df.head())
