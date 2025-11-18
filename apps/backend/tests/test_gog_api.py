from unittest import TestCase

from gog_api import gog_data


class Test(TestCase):
    def test_gog_data(self):
        test_game = "The Witcher 3: Wild Hunt"
        result = gog_data(test_game)
        self.assertEqual(result["gog_id"], 1207664663)  # formerly 1640424747
        self.assertTrue("Witcher 3" in result["title"])
