import os

import requests

from src.constants import APP_ID
from src.game_ratings import games_from_accounts
from src.utils import init_df


def create_directory(dir_name):
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)


def download_thumbnail(app_id):
    url = f"https://steamcdn-a.akamaihd.net/steam/apps/{app_id}/header.jpg"
    path = f"thumbnails/{app_id}.png"

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
    create_directory("thumbnails")

    for app_id in app_ids:
        if app_id != 0:
            download_thumbnail(app_id)


def thumbnails():
    df = init_df()
    df = games_from_accounts(df)

    app_ids_list = df[APP_ID].tolist()
    download_thumbnails(app_ids_list)


if __name__ == "__main__":
    thumbnails()
