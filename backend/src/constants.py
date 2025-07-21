import os

is_running_in_docker = os.path.exists("/.dockerenv")
# is_running_tests = os.getenv('PYTEST_ENV', 'production') == "mock"

DATA_FOLDER = "../data"
if is_running_in_docker:
    DATA_FOLDER = "../../data"

game_name = "name"
store_name = "store"
played_flag = "played"

RATING_FIELD = "rating"
REVIEW_SCORE_FIELD = "review_score"
HIDE_FIELD = "hide"
LATER_FIELD = "later"
CUSTOM_RATING = "custom_rating"
found_game_name = "found_game_name"
APP_ID = "app_id"
CORRECTED_APP_ID = "corrected_app_id"
URL = "url"
review_score = "review_score"
total_reviews = "total_reviews"
HASH = "game_hash"
THUMBNAIL_URL = "thumbnail_url"
METACRITIC_SCORE = "metacritic_score"
METACRITIC_GAME_NAME = "metacritic_game_name"
HLTB_MAIN_STORY = "hltb_main_story"
MC_HLTB_RATIO = "mc_hltb_ratio"


MINIMUM_RATING = 0.8

DATA_FILEPATH = DATA_FOLDER + "/" + "data.parquet"
GOG_FILEPATH = DATA_FOLDER + "/" + "gog.parquet"
EDITABLE_DATA_FILEPATH = DATA_FOLDER + "/" + "editable_data.parquet"
THUMBNAILS_FILEPATH = DATA_FOLDER + "/" + "thumbnails"
