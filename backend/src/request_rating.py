import json
import logging
import os
import traceback
from functools import partial

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from settings import drop_demo_in_names
from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    DATA_FOLDER,
    RATING_FIELD,
    found_game_name,
    game_name,
)
from utils import without_demo_in_name

load_dotenv()

# Configure logging
logging.basicConfig(
    filename="exception_log.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.ERROR,
)

steam_catalog_file = DATA_FOLDER + "/" + "steam_game_app_ids.json"
steam_catalog_url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"


def request_rating(df: pd.Series) -> pd.Series:
    try:
        if df[APP_ID] == 0:
            df[APP_ID], df[found_game_name] = app_id_matched_by_search(df[game_name])

        if df[APP_ID] != 0:
            # FIXME: Inline change of df
            steam_rating(df[APP_ID], df)
    except Exception as e:
        logging.exception(f"An error occurred: {e!s} for {df[game_name]} ")
        logging.error("Exception information:", exc_info=True)
        tb = traceback.format_exc()
        logging.exception("Full traceback:\n" + tb)
        raise e

    return df


def steam_rating(application_id, df):
    steam_url = f"https://store.steampowered.com/appreviews/{application_id}?json=1&num_per_page=0"
    response = requests.request("GET", steam_url, headers={}, data={})
    text = json.loads(response.text)
    if "success" in text.keys() and text["success"] == 1:
        if text["query_summary"]["total_reviews"] > 0:
            rating = text["query_summary"]["total_positive"] / text["query_summary"]["total_reviews"]
            df[RATING_FIELD] = rating
            for key, value in text["query_summary"].items():
                df[key] = value
    else:
        response.raise_for_status()


# Update rows where APP_ID == 0 by applying steam_app_id
def update_app_id_and_name(row: pd.Series, catalog: dict) -> pd.Series:
    print(f"Working {row[game_name]}: {row[APP_ID]}", end="\t")
    name = row[game_name]
    if drop_demo_in_names:
        name = without_demo_in_name(name)
    row[APP_ID] = app_id_matched_by_catalog(name, catalog=catalog)
    row[found_game_name] = name
    print(f"Found: {row[APP_ID]}")
    return row


def steam_app_ids_matched(df: pd.DataFrame) -> pd.DataFrame:
    df.loc[df[CORRECTED_APP_ID] != 0, [APP_ID, found_game_name]] = df.loc[df[CORRECTED_APP_ID] != 0, [CORRECTED_APP_ID, game_name]].values

    catalog = load_catalog()
    update_func = partial(update_app_id_and_name, catalog=catalog)
    df.loc[df[APP_ID] == 0] = df.loc[df[APP_ID] == 0].apply(update_func, axis=1)

    return df


def app_id_matched_by_catalog(name: str, catalog: dict) -> int:
    if name in catalog:
        return catalog[name]
    return 0


def restructure_data(data: dict) -> dict:
    apps = data.get("applist", {}).get("apps", [])
    return {app["name"]: app["appid"] for app in apps}


def load_catalog() -> dict:
    data = {}
    if os.path.exists(steam_catalog_file):
        # TODO: Loading fails partially?
        # File Access -> file must be in proper shape
        with open(steam_catalog_file, encoding="utf-8") as file:
            # basically ORM/mapping
            data = restructure_data(json.load(file))

    if not data:
        # HTTP request
        response = requests.get(steam_catalog_url)

        if response.status_code == 200:
            # basically ORM/mapping
            data = restructure_data(response.json())

            with open(steam_catalog_file, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
    return data


def app_id_matched_by_search(name: str) -> tuple[int, str]:
    url = (
        f"https://store.steampowered.com/search/suggest?term={name}&f=games&cc=DE&realm=1&l=english&"
        f"v=25120873&excluded_content_descriptors[]=3&excluded_content_descriptors[]=4&"
        f"use_store_query=1&use_search_spellcheck=1&search_creators_and_tags=1"
    )
    payload = {}
    headers = {"Cookie": "browserid=3512330266224273470"}
    response = requests.request("GET", url, headers=headers, data=payload)
    soup = BeautifulSoup(response.text, "html.parser")
    matches = soup.find_all("a", class_="match")
    # TODO: Right now, only take the first match

    matched_name = name
    app_id = 0
    if matches:
        matched_name = matches[0].find("div", class_="match_name").text.strip()
        if "data-ds-appid" in matches[0]:
            app_id = int(matches[0]["data-ds-appid"])
    return app_id, matched_name


def game_by_app_id(app_id: int):
    url = "https://store.steampowered.com/api/appdetails"
    try:
        # Make the API request
        response = requests.get(url, params={"appids": app_id})
        response.raise_for_status()  # Raise an error for bad responses

        # Parse the JSON response
        data = response.json()

        # Check if the game details are available
        if data[str(app_id)]["success"]:
            game_data = data[str(app_id)]["data"]
            name = game_data.get("name", "")
            thumbnail_url = game_data.get("header_image", "")  # Get thumbnail URL

            return {game_name: name, "thumbnail_url": thumbnail_url}
        return {"error": "Game not found"}

    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return {"error": str(e)}
