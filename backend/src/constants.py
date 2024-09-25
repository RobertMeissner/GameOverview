import os

is_running_in_docker = os.path.exists("/.dockerenv")

DATA_FOLDER = "../data"
if is_running_in_docker:
    DATA_FOLDER = "../../data"

game_name = "name"
store_name = "store"
played_flag = "played"

RATING_FIELD = "rating"
REVIEW_SCORE_FIELD = "review_score"
HIDE_FIELD = "hide"
CUSTOM_RATING = "custom_rating"
found_game_name = "found_game_name"
APP_ID = "app_id"
CORRECTED_APP_ID = "corrected_app_id"
URL = "url"
review_score = "review_score"
total_reviews = "total_reviews"
HASH = "game_hash"

MINIMUM_RATING = 0.8

DATA_FILEPATH = DATA_FOLDER + "/" + "data.parquet"
GOG_FILEPATH = DATA_FOLDER + "/" + "gog.parquet"
EDITABLE_DATA_FILEPATH = DATA_FOLDER + "/" + "editable_data.parquet"
THUMBNAILS_FILEPATH = DATA_FOLDER + "/" + "thumbnails"
