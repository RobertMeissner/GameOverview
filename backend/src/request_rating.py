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
        logging.error(f"An error occurred: {str(e)} for {df[game_name]} ")
        logging.error("Exception information:", exc_info=True)
        tb = traceback.format_exc()
        logging.error("Full traceback:\n" + tb)

    print(f"{df[game_name]}\t{df[APP_ID]}\tdata: {round(df[RATING_FIELD], 3) * 100}")

    return df


def steam_rating(application_id, df):
    steam_url = f"https://store.steampowered.com/appreviews/{application_id}?json=1&num_per_page=0"
    response = requests.request("GET", steam_url, headers={}, data={})
    text = json.loads(response.text)
    if "success" in text.keys() and text["success"] == 1:
        if text["query_summary"]["total_reviews"] > 0:
            rating = (
                text["query_summary"]["total_positive"]
                / text["query_summary"]["total_reviews"]
            )
            df[RATING_FIELD] = rating
            for key, value in text["query_summary"].items():
                df[key] = value


# Update rows where APP_ID == 0 by applying steam_app_id
def update_app_id_and_name(row: pd.Series, catalog: dict) -> pd.Series:
    print(f"Working {row[game_name]}: {row[APP_ID]}", end="\t")
    name = row[game_name]
    if drop_demo_in_names:
        name = name.replace("DEMO", "").replace("demo", "").replace("Demo", "").strip()
    row[APP_ID] = app_id_matched_by_catalog(name, catalog=catalog)
    row[found_game_name] = name
    print(f"Found: {row[APP_ID]}")
    return row


def steam_app_ids_matched(df: pd.DataFrame) -> pd.DataFrame:
    df.loc[df[CORRECTED_APP_ID] != 0, [APP_ID, found_game_name]] = df.loc[
        df[CORRECTED_APP_ID] != 0, [CORRECTED_APP_ID, game_name]
    ].values

    catalog = load_catalog()
    update_func = partial(update_app_id_and_name, catalog=catalog)
    df.loc[df[APP_ID] == 0] = df.loc[df[APP_ID] == 0].apply(update_func, axis=1)

    return df


def app_id_matched_by_catalog(name: str, catalog: dict) -> int:
    if name in catalog.keys():
        return catalog[name]
    return 0


def restructure_data(data: dict) -> dict:
    apps = data.get("applist", {}).get("apps", [])
    return {app["name"]: app["appid"] for app in apps}


def load_catalog() -> dict:
    data = {}
    if os.path.exists(steam_catalog_file):
        # TODO: Loading fails partially
        with open(steam_catalog_file, encoding="utf-8") as file:
            data = restructure_data(json.load(file))

    if not data:
        response = requests.get(steam_catalog_url)

        if response.status_code == 200:
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
