import json
import re

import pandas as pd
from bs4 import BeautifulSoup

from src.constants import game_name, played_flag, store_name
from src.utils import add_columns, init_df


def parse_epic_file_for_gamelist(file_path: str) -> pd.DataFrame:
    df = init_df()

    with open(file_path, "r") as file:
        data = file.read()

    soup = BeautifulSoup(data, 'html.parser')
    filtered_items = soup.find_all("a",
                                   class_="am-1xcu1kd")
    for item in filtered_items:
        name = item.find("span").find("span").text.strip()
        # pattern = re.compile('[\W_]+', re.UNICODE)
        # name = pattern.sub('', name)
        df = pd.concat(
            [
                df,
                pd.DataFrame(
                    [
                        {
                            game_name: name.strip(),
                            store_name: "epic",
                            played_flag: False,
                        }
                    ]
                ),
            ],
            ignore_index=True,
        )
    return add_columns(df)



if __name__ == '__main__':
    df = parse_epic_file_for_gamelist("data/epic.html")
    print(df.head())