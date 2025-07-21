import pandas as pd
import requests
from bs4 import BeautifulSoup
from constants import APP_ID, METACRITIC_GAME_NAME, METACRITIC_SCORE, game_name
from tqdm import tqdm

meta_critic_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


class GameDataScraper:
    def __init__(self):
        # HowLongToBeat constants
        self.HLTB_BASE_URL = "https://howlongtobeat.com/"
        self.HLTB_SEARCH_URL = f"{self.HLTB_BASE_URL}api/search"
        self.HLTB_DETAIL_URL = f"{self.HLTB_BASE_URL}game?id="
        self.HLTB_IMAGE_URL = f"{self.HLTB_BASE_URL}games/"

        self.hltb_payload = {
            "searchType": "games",
            "searchTerms": [],
            "searchPage": 1,
            "size": 20,
            "searchOptions": {
                "games": {
                    "userId": 0,
                    "platform": "",
                    "sortCategory": "popular",
                    "rangeCategory": "main",
                    "rangeTime": {"min": 0, "max": 0},
                    "gameplay": {"perspective": "", "flow": "", "genre": ""},
                    "modifier": "",
                },
                "users": {"sortCategory": "postcount"},
                "filter": "",
                "sort": 0,
                "randomizer": 0,
            },
        }

    def get_howlongtobeat_data(self, game_name):
        """https://howlongtobeat.com/api/s/734c523671943765"""
        """
            Disable Cache
            79 requests
            972.28 kB / 525.22 kB transferred
            Finish: 57.18 s
            searchOptions	{…}
            filter	""
            games	{…}
            gameplay	{…}
            difficulty	""
            flow	""
            genre	""
            perspective	""
            modifier	""
            platform	""
            rangeCategory	"main"
            rangeTime	{…}
            max	null
            min	null
            rangeYear	{…}
            max	""
            min	""
            sortCategory	"popular"
            userId	0
            lists	{…}
            sortCategory	"follows"
            randomizer	0
            sort	0
            users	{…}
            sortCategory	"postcount"
            searchPage	1
            searchTerms	[…]
            0	"cyberpun"
            searchType	"games"
            size	20
            useCache	true
            curl 'https://howlongtobeat.com/api/s/734c523671943765' --compressed -X POST -H 'User-Agent:
            Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0' -H 'Accept: */*'
            -H 'Accept-Language: en-GB,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br, zstd'
            -H 'Referer: https://howlongtobeat.com/?q=cyberpunk' -H 'Content-Type: application/json'
            -H 'Origin: https://howlongtobeat.com' -H 'DNT: 1' -H 'Connection: keep-alive'
            -H 'Cookie: OptanonConsent=isGpcEnabled=0&datestamp=Thu+Feb+06+2025+20%3A32%3A13+GMT%2B0100+
            (Central+European+Standard+Time)&version=202501.1.0&browserGpcFlag=0&isIABGlobal=false&
            consentId=84c74934-1c52-45b1-a935-63696870591a&interactionCount=1&isAnonUser=1&
            landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0004%3A0%2CV2STACK42%3A0&
            hosts=H36%3A1%2CH1%3A0%2Clie%3A0%2CH23%3A0%2CH35%3A0%2CH1191%3A0%2CH43%3A0%2CH45%3A0%2CH290%3A0%2CH49%3A0%2
            CH51%3A0%2CH57%3A0%2CH198%3A0%2CH66%3A0%2CH67%3A0%2CH73%3A0%2Cfgs%3A0%2CH78%3A0%2CH184%3A0%2CH79%3A0%2CH85%
            3A0%2CH302%3A0%2CH93%3A0%2CH2%3A0%2CH4%3A0%2CH205%3A0%2CH185%3A0%2CH12%3A0%2CH283%3A0%2CH17%3A0%2CH18%3A0%2
            CH26%3A0%2CH32%3A0%2CH140%3A0%2CH38%3A0%2CH1002%3A0%2CH47%3A0%2CH54%3A0%2CH58%3A0%2CH894%3A0%2CH1352%3A0%2C
            H298%3A0%2CH83%3A0%2CH177%3A0%2CH86%3A0%2Cyyf%3A0%2CH89%3A0%2CH90%3A0%2CH547%3A0%2CH425%3A0%2CH970%3A0%2CH9
            4%3A0%2CH95%3A0%2CH657%3A0&genVendors=&intType=2&geolocation=DE%3BNW&AwaitingReconsent=false; opt_out=1;
            zdconsent=optout; OptanonAlertBoxClosed=2024-11-15T18:14:17.366Z;
            eupubconsent-v2=CQIIQlgQIIQlgAcABBENBPFwAAAAAEPgACiQAAAVGAJMNCogDLIkJCDQMIIEAKgrCAigQBAAAkDRAQAmDAp2BgEusJE
            AIAUAAwQAgABBkACAAASABCIAIACgQAAQCBQABAAQDAQAMDAAGACwEAgABAdAxTAggECwASMyIhTAhCASCAlsqEEgCBBXCEIs8CiAREwUAA
            AJABWAAICwWBxJICViQQJcQbQAAEACAQQAFCKTswBBAGbLUXiwbRlaYFg-YLntMAyQIggAAAAA.YAAACHwAAAAA'
            -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' -H 'Priority: u=4'
            -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' -H 'TE: trailers' --data-raw '{"searchType":"games",
            "searchTerms":["cyberpun"],"searchPage":1,"size":20,"searchOptions":{"games":{"userId":0,"platform":"",
            "sortCategory":"popular","rangeCategory":"main","rangeTime":{"min":null,"max":null},"gameplay":
            {"perspective":"","flow":"","genre":"","difficulty":""},"rangeYear":{"min":"","max":""},"modifier":""},
            "users":{"sortCategory":"postcount"},"lists":{"sortCategory":"follows"},"filter":"","sort":0,
            "randomizer":0},"useCache":true}'
        """
        try:
            # Prepare the search terms
            search_terms = game_name.split()
            payload = self.hltb_payload.copy()
            payload["searchTerms"] = search_terms

            # Prepare headers
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36",
                "content-type": "application/json",
                "origin": "https://howlongtobeat.com/",
                "referer": "https://howlongtobeat.com/",
            }

            # Make the request
            response = requests.post(self.HLTB_SEARCH_URL, headers=headers, json=payload, timeout=20)

            print(response.status_code)
            if response.status_code == 200:
                data = response.json()
                if data and len(data.get("data", [])) > 0:
                    game_data = data["data"][0]
                    return {
                        "main_story": game_data.get("comp_main"),  # Main Story
                        "main_extra": game_data.get("comp_plus"),  # Main + Extra
                        "completionist": game_data.get("comp_100"),  # Completionist
                        "game_id": game_data.get("game_id"),
                        "similarity": self.string_similarity(game_name, game_data.get("game_name", "")),
                    }
            else:
                print(f"HowLongToBeat API returned status code: {response.status_code}")
                print(f"Response content: {response.text}")
            return None

        except Exception as e:
            print(f"Error fetching HowLongToBeat data for {game_name}: {e!s}")
            return None

        except Exception as e:
            print(f"Error fetching HowLongToBeat data for {game_name}: {e!s}")
            return None


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
        print(f"Error fetching Metacritic score for {name}: {e!s}")
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
