import json
import logging
import os
import re
import traceback

import pandas as pd
import requests
from dotenv import load_dotenv

from src.constants import RATING_FIELD, game_name

load_dotenv()

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
        response = requests.request("POST", url, headers=headers, data=payload)
        text = json.loads(response.text)

        if "hits" in text.keys() and len(text["hits"]):
            app_id = text["hits"][0]["id"]
            df["app_id"] = app_id

            found_game_name = re.sub(
                r"<[^>]+>", "", text["hits"][0]["_highlightResult"][game_name]["value"]
            )
            df["found_game_name"] = found_game_name

            steam_url = f"https://store.steampowered.com/appreviews/{app_id}?json=1&num_per_page=0"

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

    print(f"{df[game_name]}\t{df['app_id']}\tdata: {df[RATING_FIELD]}")

    return df
