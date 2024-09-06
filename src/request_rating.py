import json
import logging
import os
import re
import traceback

import pandas as pd
import requests
from dotenv import load_dotenv

from src.constants import (
    APP_ID,
    CORRECTED_APP_ID,
    RATING_FIELD,
    found_game_name,
    game_name,
)

load_dotenv()

# To obtain ALGOLIA_API_KEY, go to https://steamdb.info/, search for a game and not the API key

url = "https://94he6yatei-dsn.algolia.net/1/indexes/all_names/query?x-algolia-agent=SteamDB%20Autocompletion"
headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Referer": "https://steamdb.info/",
    "x-algolia-application-id": "94HE6YATEI",
    "x-algolia-api-key": os.getenv("ALGOLIA_API_KEY", ""),
    "Content-Type": "text/plain;charset=UTF-8",
    "Origin": "https://steamdb.info",
    "DNT": "1",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "Priority": "u=4",
}

# Configure logging
logging.basicConfig(
    filename="exception_log.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.ERROR,
)


def request_rating(df: pd.Series) -> pd.Series:
    # API: https://www.algolia.com/doc/rest-api/search/#search-multiple-indices
    payload = (
        '{"hitsPerPage":3,"attributesToSnippet":null,"attributesToHighlight":"name","query":"'
        + df[game_name]
        + '"}'
    )
    try:
        if df[CORRECTED_APP_ID] != 0:
            df[APP_ID] = df[CORRECTED_APP_ID]
            df[found_game_name] = df[game_name]

        if df[APP_ID] == 0:
            response = requests.request("POST", url, headers=headers, data=payload)
            text = json.loads(response.text)

            if "hits" in text.keys() and len(text["hits"]):
                application_id = text["hits"][0][
                    "objectID"
                ]  # 20240905: Changed from id to objectID
                df[APP_ID] = application_id

                retrieved_game_name = re.sub(
                    r"<[^>]+>",
                    "",
                    text["hits"][0]["_highlightResult"][game_name]["value"],
                )
                df[found_game_name] = retrieved_game_name

        application_id = df[APP_ID]

        steam_url = f"https://store.steampowered.com/appreviews/{application_id}?json=1&num_per_page=0"

        response = requests.request("GET", steam_url, headers={}, data={})

        text = json.loads(response.text)
        if "success" in text.keys() and text["success"] == 1:
            if text["query_summary"]["total_reviews"] > 0:
                rating = (
                    text["query_summary"]["total_positive"]
                    / text["query_summary"]["total_reviews"]
                )
                df["rating"] = rating
                for key, value in text["query_summary"].items():
                    df[key] = value
    except Exception as e:
        logging.error(f"An error occurred: {str(e)} for {df[game_name]} ")
        logging.error("Exception information:", exc_info=True)
        tb = traceback.format_exc()
        logging.error("Full traceback:\n" + tb)

    print(f"{df[game_name]}\t{df[APP_ID]}\tdata: {df[RATING_FIELD]}")

    return df
