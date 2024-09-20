import unittest
from collections import Counter
from unittest.mock import mock_open, patch

from dotenv import load_dotenv

from src.markdown_parser import played_games


class TestParseMarkdownFile(unittest.TestCase):

    def test_played_games(self):
        mock_file_content = """# Header 1
            This is line 1.
            
            # Header 2
            
            This is line 2 with trailing spaces.   
            # Header 3
            """
        expected_output = ["This is line 1.", "This is line 2 with trailing spaces."]

        with patch("builtins.open", mock_open(read_data=mock_file_content)):
            self.assertEqual(played_games(), expected_output)

    def test_played_games_current_game_state(self):
        load_dotenv()
        result = played_games()
        line_counts = Counter(result)
        duplicates = [line for line, count in line_counts.items() if count > 1]
        self.assertEqual(len(result), 251)
        self.assertEqual(len(duplicates), 0)


if __name__ == "__main__":
    unittest.main()
