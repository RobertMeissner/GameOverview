import json
import logging
import os
import traceback

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
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

steam_catalog_file = "steam_game_app_ids.json"
steam_catalog_url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"


def request_rating(df: pd.Series) -> pd.Series:
    if df[CORRECTED_APP_ID] != 0:
        df[APP_ID] = df[CORRECTED_APP_ID]
        df[found_game_name] = df[game_name]

    if df[APP_ID] == 0:
        df[APP_ID], df[found_game_name] = steam_app_id(df[game_name])

    try:
        if df[APP_ID] != 0:
            steam_rating(df[APP_ID], df)
    except Exception as e:
        logging.error(f"An error occurred: {str(e)} for {df[game_name]} ")
        logging.error("Exception information:", exc_info=True)
        tb = traceback.format_exc()
        logging.error("Full traceback:\n" + tb)

    print(f"{df[game_name]}\t{df[APP_ID]}\tdata: {round(df[RATING_FIELD],3)*100}")

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


def steam_app_id(name: str) -> tuple[int, str]:
    app_id = app_id_matched_by_catalog(name)
    matched_name = name
    if app_id == 0:
        app_id, matched_name = app_id_matched_by_search(name)
    return app_id, matched_name


def app_id_matched_by_catalog(name: str) -> int:
    catalog = load_catalog()
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
