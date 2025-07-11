import pandas as pd
import requests
from bs4 import BeautifulSoup
from constants import APP_ID, METACRITIC_GAME_NAME, METACRITIC_SCORE, game_name
from howlongtobeatpy import HowLongToBeat, HowLongToBeatEntry
from tqdm import tqdm

meta_critic_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


class GameDataScraper:
    def __init__(self):
        self.hltb = HowLongToBeat()

    def get_howlongtobeat_data(self, game_name) -> HowLongToBeatEntry:
        result = self.hltb.search(game_name)
        # for game in result:
        #    print(game.game_name, game.main_story)
        return result[0]


def get_metacritic_score(name: str) -> (str, int):
    try:
        # First, search for the game
        search_name = name.lower().replace(":", "").replace("'", "")
        search_url = f"https://www.metacritic.com/search/{search_name}/"

        response = requests.get(search_url, headers=meta_critic_headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")

            # Find the first game result
            score_elements = soup.find_all("div", {"class": "c-siteReviewScore"})

            for score_element in score_elements:
                # Look for parent elements to verify it's a PC game
                parent_container = score_element.find_parent("a")
                if parent_container:
                    # Get the score value
                    score_text = score_element.find("span")
                    name = parent_container.find(
                        "p",
                        class_="g-text-medium-fluid g-text-bold g-outer-spacing-bottom-small u-text-overflow-ellipsis",
                    ).text.strip()
                    if score_text:
                        try:
                            return name, int(score_text.text.strip())
                        except ValueError:
                            continue
        return name, None

    except Exception as e:
        print(f"Error fetching Metacritic score for {name}: {str(e)}")
        return name, None


def enrich_game_data(df: pd.DataFrame):
    for idx, row in tqdm(
        df.iterrows(),
        total=df.shape[0],
        bar_format="{l_bar}{bar}| {percentage:.0f}% | {elapsed}<{remaining} | {n_fmt}/{total_fmt} games processed",
    ):

        # Get Metacritic score
        metacritic_game_name, metacritic_score = get_metacritic_score(row[game_name])
        df.at[idx, METACRITIC_SCORE] = metacritic_score
        df.at[idx, METACRITIC_GAME_NAME] = metacritic_game_name

        #
        # # Get HowLongToBeat data
        # hltb_data = self.get_howlongtobeat_data(game_name)
        # if hltb_data:
        #     df.at[idx, 'hltb_main_story'] = hltb_data['main_story']
        #     df.at[idx, 'hltb_main_extra'] = hltb_data['main_extra']
        #     df.at[idx, 'hltb_completionist'] = hltb_data['completionist']
        #     df.at[idx, 'hltb_game_id'] = hltb_data['game_id']
        #     df.at[idx, 'hltb_similarity'] = hltb_data['similarity']

    return df


# Example usage
if __name__ == "__main__":
    # Sample dataframe
    df = pd.DataFrame(
        {
            game_name: ["The Witcher 3", "Red Dead Redemption 2", "Cyberpunk 2077"],
            APP_ID: [292030, 1174180, 1091500],
            "gog_id": ["1207664663", "1234567890", "1234567891"],
            "epic_name": ["witcher3", "rdr2", "cyberpunk2077"],
        }
    )

    enriched_df = enrich_game_data(df)
    print(enriched_df[[METACRITIC_SCORE, METACRITIC_GAME_NAME]])
