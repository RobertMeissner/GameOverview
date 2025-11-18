import os

import requests
from src.constants import APP_ID, THUMBNAILS_FILEPATH
from src.game_ratings import games_from_accounts
from src.utils import init_df


def create_directory(dir_name):
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)


def download_thumbnail(app_id):
    url = f"https://steamcdn-a.akamaihd.net/steam/apps/{app_id}/header.jpg"
    path = f"{THUMBNAILS_FILEPATH}/{app_id}.png"

    if not os.path.exists(path):
        response = requests.get(url, stream=True)

        if response.status_code == 200:
            with open(path, "wb") as file:
                for chunk in response.iter_content(chunk_size=128):
                    file.write(chunk)
            print(f"Downloaded thumbnail for app_id {app_id}")
        else:
            print(f"Failed to download thumbnail for app_id {app_id}")
    else:
        print(f"Thumbnail for app_id {app_id} already exists. Skipping download.")


def download_thumbnails(app_ids):
    create_directory(THUMBNAILS_FILEPATH)

    for app_id in app_ids:
        if app_id != 0:
            download_thumbnail(app_id)


def thumbnails():
    df = init_df()
    df = games_from_accounts(df)

    app_ids_list = df[APP_ID].tolist()
    download_thumbnails(app_ids_list)


# import os
#
# import pandas as pd
# import requests
#
#
# def download_gog_thumbnails(parquet_filepath: str, output_folder: str = "thumbnails"):
#     # Create the output folder if it doesn't exist
#     os.makedirs(output_folder, exist_ok=True)
#
#     # Read the parquet file
#     df = pd.read_parquet(parquet_filepath)
#
#     # Iterate through each row in the DataFrame
#     for index, row in df.iterrows():
#         gog_id = row["gog_id"]
#         cover_horizontal = row["coverHorizontal"]
#         cover_vertical = row["coverVertical"]
#
#         # Download and save the horizontal cover image
#         if cover_horizontal:
#             hor_filename = os.path.join(output_folder, f"{gog_id}_hor.png")
#             download_image(cover_horizontal, hor_filename)
#
#         # Download and save the vertical cover image
#         if cover_vertical:
#             ver_filename = os.path.join(output_folder, f"{gog_id}_ver.jpg")
#             download_image(cover_vertical, ver_filename)
#
#
# def download_image(url: str, file_path: str):
#     response = requests.get(url, stream=True)
#     if response.status_code == 200:
#         with open(file_path, "wb") as out_file:
#             for chunk in response.iter_content(chunk_size=8192):
#                 out_file.write(chunk)
#     else:
#         print(f"Failed to download {url}")
#
#
# # Example usage
# download_gog_thumbnails("path_to_your_parquet_file.parquet")

if __name__ == "__main__":
    thumbnails()
