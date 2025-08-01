import unittest
from unittest.mock import mock_open, patch

import pandas as pd

from backend.src.gog_parser import parse_gog_file_for_gamelist
import pytest


def init_df():
    return pd.DataFrame(columns=["game_name", "store_name", "played_flag"])


valid_json_data = """
    var gogData = {
        "accountProducts": [
            {"title": "Cyberpunk 2077"},
            {"title": "The Witcher 3"}
        ]
    };
    """
invalid_json_data = """
    var gogData = {
        "accountProducts":
            {"title": "Cyberpunk 2077"},
            {"title": "The Witcher 3"}
    };
    """

empty_json_data = """
    var gogData = {
        "accountProducts": []
    };
    """

no_account_products_data = """
    var gogData = {};
    """


@pytest.skip(reason="Not being implemented", allow_module_level=True)
class TestParseGoGFile(unittest.TestCase):
    def test_valid_data(self):
        with patch("builtins.open", mock_open(read_data=valid_json_data)), patch("builtins.print"):
            df = parse_gog_file_for_gamelist("fakepath/mockfile.txt")
            self.assertEqual(len(df), 2)  # Expect 2 rows
            self.assertEqual(len(list(df.columns)), 45)

    def test_invalid_data(self):
        with patch("builtins.open", mock_open(read_data=invalid_json_data)), patch("builtins.print") as mocked_print:
            df = parse_gog_file_for_gamelist("fakepath/mockfile.txt")
            assert mocked_print.mock_calls[0][1][0] == "Error parsing JSON:"
            self.assertEqual(df.empty, True)

    def test_empty_account_products(self):
        with patch("builtins.open", mock_open(read_data=empty_json_data)), patch("builtins.print"):
            df = parse_gog_file_for_gamelist("fakepath/mockfile.txt")
            self.assertEqual(df.empty, True)

    def test_missing_account_products(self):
        with patch("builtins.open", mock_open(read_data=no_account_products_data)):
            df = parse_gog_file_for_gamelist("fakepath/mockfile.txt")
            self.assertEqual(df.empty, True)

    def test_file_not_found_error(self):
        with self.assertRaises(FileNotFoundError):
            parse_gog_file_for_gamelist("nonexistentpath/fakefile.txt")
