from metacritic_scraper import GameDataScraper

# search_url = f"https://www.metacritic.com/search/{quote(game_name)}/"
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
# }
#
# # HowLongToBeat search endpoint
# search_url = "https://howlongtobeat.com/api/search"
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
#     'Content-Type': 'application/json'
# }
#
# search_data = {
#     "searchType": "games",
#     "searchTerms": [game_name.split()],
#     "searchPage": 1,
#     "size": 20
# }
#


def value_for_time_ratio(games: list[str]):
    scraper = GameDataScraper()
    for game in games:
        hltb_entry = scraper.get_howlongtobeat_data(game)
        print(hltb_entry.game_name, hltb_entry.main_story)


if __name__ == "__main__":
    games = ["Half-Life", "Outer Wilds"]
    value_for_time_ratio(games)
