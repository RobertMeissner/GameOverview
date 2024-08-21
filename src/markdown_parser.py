import os

import pandas as pd
from dotenv import load_dotenv

from src.constants import game_name, played_flag, store_name
from src.utils import init_df


def read_and_filter_markdown(file_path: str, store="", played=False) -> pd.DataFrame:
    df = init_df()

    # Check if file exists
    if os.path.exists(file_path):
        # Open and read the file
        with open(file_path, "r") as file:
            lines = file.readlines()

        # Filter lines
        for line in lines:
            line = line.replace("\n", "")
            # Check if line is not empty and does not start with a symbol
            if line and line.strip()[0].isalnum():
                game_row = {
                    game_name: line.strip(),
                    store_name: store,
                    played_flag: played,
                }
                df = pd.concat([df, pd.DataFrame([game_row])], ignore_index=True)

        df = df.sort_values(by="name", ascending=True)
        df = df.drop_duplicates(subset="name")

    return df


if __name__ == "__main__":
    load_dotenv()
    # Construct full path to the file
    file_path = os.path.join(
        os.getenv("MARKDOWN_PATH", ""), "gespielte Computerspiele.md"
    )

    # Call the function and print the result
    filtered_content = read_and_filter_markdown(file_path, pd.NA, True)
    print(filtered_content.info())
    print(filtered_content.shape)
