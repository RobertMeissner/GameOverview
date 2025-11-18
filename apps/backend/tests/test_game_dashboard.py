import pandas as pd
import pytest

from apps.streamlit_dashboard.game_dashboard import update_with_edited_data


@pytest.mark.parametrize(
    "df_original, df_edited, expected",
    [
        # Test 1: Basic functionality
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash2", "hash3"],
                    "data": ["data1", "data2", "data3"],
                    "hide": [False, False, False],
                }
            ),
            pd.DataFrame({"game_hash": ["hash2"], "data": ["new_data2"], "hide": [True]}),
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash2", "hash3"],
                    "data": ["data1", "new_data2", "data3"],
                    "hide": [False, True, False],
                }
            ),
        ),
        # Test 2: Check for duplicate hashes
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash1", "hash2"],
                    "data": ["data1", "data1", "data2"],
                    "hide": [False, False, False],
                }
            ),
            pd.DataFrame({"game_hash": ["hash1"], "data": ["new_data1"], "hide": [True]}),
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash2"],
                    "data": ["new_data1", "data2"],
                    "hide": [True, False],
                }
            ),
        ),
        # Test 4: Check for non-existing hashes in edited dataframe
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash2", "hash3"],
                    "data": ["data1", "data2", "data3"],
                    "hide": [False, False, False],
                }
            ),
            pd.DataFrame({"game_hash": ["hash4"], "data": ["new_data4"], "hide": [True]}),
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash2", "hash3"],
                    "data": ["data1", "data2", "data3"],
                    "hide": [False, False, False],
                }
            ),
        ),
        # Test 5: Multiple changes in both "hide" and "played" columns
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": ["data" + str(i) for i in range(1, 11)],
                    "hide": [False] * 10,
                    "played": ["played" + str(i) for i in range(1, 11)],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash2", "hash4", "hash6", "hash8", "hash10"],
                    "data": [
                        "new_data2",
                        "new_data4",
                        "new_data6",
                        "new_data8",
                        "new_data10",
                    ],
                    "hide": [True] * 5,
                    "played": [
                        "new_played2",
                        "new_played4",
                        "new_played6",
                        "new_played8",
                        "new_played10",
                    ],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": [
                        "data1",
                        "new_data2",
                        "data3",
                        "new_data4",
                        "data5",
                        "new_data6",
                        "data7",
                        "new_data8",
                        "data9",
                        "new_data10",
                    ],
                    "hide": [
                        False,
                        True,
                        False,
                        True,
                        False,
                        True,
                        False,
                        True,
                        False,
                        True,
                    ],
                    "played": [
                        "played1",
                        "new_played2",
                        "played3",
                        "new_played4",
                        "played5",
                        "new_played6",
                        "played7",
                        "new_played8",
                        "played9",
                        "new_played10",
                    ],
                }
            ),
        ),
        # Test 6: Multiple changes in "hide" column only
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": ["data" + str(i) for i in range(1, 11)],
                    "hide": [False] * 10,
                    "played": ["played" + str(i) for i in range(1, 11)],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash3", "hash6", "hash9"],
                    "data": ["data3", "data6", "data9"],
                    "hide": [True] * 3,
                    "played": ["played3", "played6", "played9"],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": ["data" + str(i) for i in range(1, 11)],
                    "hide": [
                        False,
                        False,
                        True,
                        False,
                        False,
                        True,
                        False,
                        False,
                        True,
                        False,
                    ],
                    "played": ["played" + str(i) for i in range(1, 11)],
                }
            ),
        ),
        # Test 7: Multiple changes in "played" column only
        (
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": ["data" + str(i) for i in range(1, 11)],
                    "hide": [False] * 10,
                    "played": ["played" + str(i) for i in range(1, 11)],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash1", "hash5", "hash10"],
                    "data": ["data1", "data5", "data10"],
                    "hide": [False] * 3,
                    "played": ["new_played1", "new_played5", "new_played10"],
                }
            ),
            pd.DataFrame(
                {
                    "game_hash": ["hash" + str(i) for i in range(1, 11)],
                    "data": ["data" + str(i) for i in range(1, 11)],
                    "hide": [False] * 10,
                    "played": [
                        "new_played1",
                        "played2",
                        "played3",
                        "played4",
                        "new_played5",
                        "played6",
                        "played7",
                        "played8",
                        "played9",
                        "new_played10",
                    ],
                }
            ),
        ),
    ],
)
def test_update_with_edited_data(df_original, df_edited, expected):
    df_updated = update_with_edited_data(df_original, df_edited)
    pd.testing.assert_frame_equal(df_updated, expected)
