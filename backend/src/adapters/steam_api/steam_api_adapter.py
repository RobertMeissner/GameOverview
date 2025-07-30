from __future__ import annotations

import json
import requests
from bs4 import BeautifulSoup

from domain.ports.steam_api import SteamAPI


class SteamAPIAdapter(SteamAPI):
    """Adapter that implements Steam API functionality using HTTP requests."""

    def get_game_by_app_id(self, app_id: int) -> dict | None:
        """Get Steam game details by app ID.

        Copied from request_rating.game_by_app_id()
        """
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

                return {"game_name": name, "thumbnail_url": thumbnail_url}
            else:
                return None

        except requests.RequestException as e:
            print(f"An error occurred: {e}")
            return None

    def search_game_by_name(self, name: str) -> tuple[int, str]:
        """Search for a Steam game by name.

        Copied from request_rating.app_id_matched_by_search()
        """
        url = (
            f"https://store.steampowered.com/search/suggest?term={name}&f=games&cc=DE&realm=1&l=english&"
            f"v=25120873&excluded_content_descriptors[]=3&excluded_content_descriptors[]=4&"
            f"use_store_query=1&use_search_spellcheck=1&search_creators_and_tags=1"
        )
        payload = {}
        headers = {"Cookie": "browserid=3512330266224273470"}

        try:
            response = requests.request("GET", url, headers=headers, data=payload)
            soup = BeautifulSoup(response.text, "html.parser")
            matches = soup.find_all("a", class_="match")

            matched_name = name
            app_id = 0
            if matches:
                matched_name = matches[0].find("div", class_="match_name").text.strip()
                if "data-ds-appid" in matches[0]:
                    app_id = int(matches[0]["data-ds-appid"])
            return app_id, matched_name
        except Exception:
            return 0, name
