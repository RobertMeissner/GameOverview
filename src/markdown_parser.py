import os

from dotenv import load_dotenv


def played_games() -> list:
    file_path = os.path.join(
        os.getenv("MARKDOWN_PATH", ""), "gespielte Computerspiele.md"
    )
    cleaned_lines = []
    with open(file_path, encoding="utf-8") as file:
        for line in file:
            stripped_line = line.strip()
            if (
                stripped_line
                and not stripped_line.startswith("#")
                and not stripped_line.startswith("-")
            ):
                cleaned_lines.append(stripped_line.replace("[", "").replace("]", ""))

    return cleaned_lines


if __name__ == "__main__":
    load_dotenv()
    lines = played_games()
    print(lines)
