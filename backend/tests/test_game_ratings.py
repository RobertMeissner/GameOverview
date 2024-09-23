import unittest

import pandas as pd

from backend.src.game_ratings import (
    concat_if_new,
    games_from_accounts,
    games_from_stores,
    merged_data_sources,
)
from backend.src.utils import coerce_dataframe_types, init_df


def assert_dataframe_structure(df: pd.DataFrame, expected_structure: dict):
    expected_columns = list(expected_structure.keys())
    assert (
        list(df.columns) == expected_columns
    ), f"Expected columns {expected_columns}, but got {list(df.columns)}"

    actual_dtypes = df.dtypes.to_dict()
    for col, expected_dtype in expected_structure.items():
        actual_dtype = actual_dtypes[col]
        assert pd.api.types.is_dtype_equal(
            actual_dtype, expected_dtype
        ), f"Expected dtype for column '{col}' is {expected_dtype}, but got {actual_dtype}"


expected_structure = {
    "name": pd.StringDtype(),
    "game_hash": pd.StringDtype(),
    "store": pd.StringDtype(),
    "played": pd.BooleanDtype(),
    "app_id": pd.Int64Dtype(),
    "backgroundImage": pd.StringDtype(),
    "cdKey": pd.StringDtype(),
    "textInformation": pd.StringDtype(),
    "downloads": pd.StringDtype(),
    "galaxyDownloads": pd.StringDtype(),
    "extras": pd.StringDtype(),
    "dlcs": pd.StringDtype(),
    "tags": pd.StringDtype(),
    "isPreOrder": pd.StringDtype(),
    "releaseTimestamp": pd.Int64Dtype(),
    "messages": pd.StringDtype(),
    "changelog": pd.StringDtype(),
    "forumLink": pd.StringDtype(),
    "isBaseProductMissing": pd.StringDtype(),
    "missingBaseProduct": pd.StringDtype(),
    "features": pd.StringDtype(),
    "simpleGalaxyInstallers": pd.StringDtype(),
    "num_reviews": pd.Int64Dtype(),
    "review_score": pd.Int64Dtype(),
    "total_positive": pd.Int64Dtype(),
    "total_negative": pd.Int64Dtype(),
    "total_reviews": pd.Int64Dtype(),
    "found_game_name": pd.StringDtype(),
    "rating": pd.Float32Dtype(),
    "review_score_desc": pd.StringDtype(),
    "hide": pd.BooleanDtype(),
    "url": pd.StringDtype(),
    "corrected_app_id": pd.Int64Dtype(),
    "playtime_forever": pd.Int64Dtype(),
    "img_icon_url": pd.StringDtype(),
    "has_community_visible_stats": pd.StringDtype(),
    "playtime_windows_forever": pd.Int64Dtype(),
    "playtime_mac_forever": pd.Int64Dtype(),
    "playtime_linux_forever": pd.Int64Dtype(),
    "playtime_deck_forever": pd.Int64Dtype(),
    "rtime_last_played": pd.Int64Dtype(),
    "playtime_disconnected": pd.Int64Dtype(),
    "has_leaderboards": pd.StringDtype(),
    "content_descriptorids": pd.StringDtype(),
    "playtime_2weeks": pd.Int64Dtype(),
}


class TestConcatIfNew(unittest.TestCase):
    def setUp(self):
        # Common setup for all tests
        self.df1 = pd.DataFrame(
            {"name": ["Game A", "Game B", "Game C"], "other_info": [1, 2, 3]}
        )
        self.df2 = pd.DataFrame(
            {"name": ["Game B", "Game C", "Game D"], "other_info": [2, 3, 4]}
        )

    def test_concat_if_new_basic(self):
        # Test basic functionality
        result_df = concat_if_new(self.df1, self.df2)
        expected_df = pd.DataFrame(
            {
                "name": ["Game A", "Game B", "Game C", "Game D"],
                "other_info": [1, 2, 3, 4],
            }
        )
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_concat_if_new_all_new(self):
        # Test when all entries in df2 are new
        df3 = pd.DataFrame({"name": ["Game E", "Game F"], "other_info": [5, 6]})
        result_df = concat_if_new(self.df1, df3)
        expected_df = pd.DataFrame(
            {
                "name": ["Game A", "Game B", "Game C", "Game E", "Game F"],
                "other_info": [1, 2, 3, 5, 6],
            }
        )
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_concat_if_new_no_new(self):
        # Test when no new entries in df2
        df4 = pd.DataFrame({"name": ["Game A", "Game B"], "other_info": [1, 2]})
        result_df = concat_if_new(self.df1, df4)
        expected_df = self.df1  # No new entries should be added
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_concat_if_new_empty_df2(self):
        # Test when df2 is empty
        df5 = pd.DataFrame(columns=self.df1.columns).astype(self.df1.dtypes.to_dict())
        result_df = concat_if_new(self.df1, df5)
        expected_df = self.df1  # No new entries should be added
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_concat_if_new_empty_df1(self):
        # Test when df1 is empty
        df6 = pd.DataFrame({"name": ["Game E", "Game F"], "other_info": [5, 6]}).astype(
            self.df1.dtypes.to_dict()
        )

        # Create an empty DataFrame with the same dtypes as df1
        empty_df1 = pd.DataFrame(columns=self.df1.columns).astype(
            self.df1.dtypes.to_dict()
        )

        result_df = concat_if_new(empty_df1, df6)
        expected_df = df6  # All entries from df2 should be added
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_concat_if_new_different_columns(self):
        # Test when df1 and df2 have different columns
        df7 = pd.DataFrame({"name": ["Game G", "Game H"], "extra_info": [7, 8]})
        result_df = concat_if_new(self.df1, df7)
        expected_df = pd.concat([self.df1, df7], ignore_index=True)
        pd.testing.assert_frame_equal(result_df, expected_df)

    def test_init_df(self):
        df = init_df()
        assert_dataframe_structure(df, expected_structure)

    def test_games_from_stores(self):
        df = coerce_dataframe_types(games_from_stores(init_df()))
        assert_dataframe_structure(df, expected_structure)
        assert df.shape == (951, 45)
        assert df.duplicated().sum() == 1
        assert df["name"].duplicated().sum() == 1

    def test_games_from_accounts(self):
        df = games_from_accounts(init_df())
        assert_dataframe_structure(df, expected_structure)
        assert df.shape == (1176, 45)
        assert df.duplicated().sum() == 0
        assert df["name"].duplicated().sum() == 0

    def test_new_rows_added(self):
        df_loaded = pd.DataFrame(
            {
                "game_hash": ["hash1", "hash2", "hash3"],
                "data": ["data_loaded_1", "data_loaded_2", "data_loaded_3"],
            }
        )
        df = pd.DataFrame({"game_hash": ["hash4"], "data": ["data_new_4"]})
        result = merged_data_sources(df, df_loaded)
        self.assertEqual(len(result), 4)
        self.assertTrue(result[result["game_hash"] == "hash4"].shape[0] == 1)

    def test_old_rows_retained(self):
        df_loaded = pd.DataFrame(
            {
                "game_hash": ["hash1", "hash2"],
                "data": ["data_loaded_1", "data_loaded_2"],
            }
        )
        df = pd.DataFrame({"game_hash": ["hash2"], "data": ["data_new_2"]})
        result = merged_data_sources(df, df_loaded)
        self.assertEqual(len(result), 2)
        self.assertTrue(
            result[result["game_hash"] == "hash2"]["data"].values[0] == "data_loaded_2"
        )

    def test_no_unique_rows_lost(self):
        df_loaded = pd.DataFrame(
            {
                "game_hash": ["hash1", "hash2"],
                "data": ["data_loaded_1", "data_loaded_2"],
            }
        )
        df = pd.DataFrame({"game_hash": ["hash3"], "data": ["data_new_3"]})
        result = merged_data_sources(df, df_loaded)
        self.assertEqual(len(result), 3)
        self.assertTrue(result[result["game_hash"] == "hash1"].shape[0] == 1)
        self.assertTrue(result[result["game_hash"] == "hash2"].shape[0] == 1)
        self.assertTrue(result[result["game_hash"] == "hash3"].shape[0] == 1)

    def test_correct_number_of_rows(self):
        df_loaded = pd.DataFrame(
            {
                "game_hash": ["hash1", "hash3"],
                "data": ["data_loaded_1", "data_loaded_3"],
            }
        )
        df = pd.DataFrame(
            {"game_hash": ["hash2", "hash3"], "data": ["data_new_2", "data_new_3"]}
        )
        result = merged_data_sources(df, df_loaded)
        self.assertEqual(len(result), 3)


if __name__ == "__main__":
    unittest.main()
