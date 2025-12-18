#!/usr/bin/env python3
"""
Convert legacy parquet game data to a pre-seeded SQLite database.

This script reads a parquet file with legacy game data and creates a SQLite
database compatible with the JPA entities (canonical_games, personalized_games).

Usage:
    python convert_parquet_to_sqlite.py <parquet_file> [output_db]

Example:
    python convert_parquet_to_sqlite.py legacy_data.parquet ../apps/api/data/gamedb.sqlite
"""

import sqlite3
import sys
import uuid
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Error: pandas is required. Install with: pip install pandas pyarrow")
    sys.exit(1)


STEAM_THUMBNAIL_TEMPLATE = "https://steamcdn-a.akamaihd.net/steam/apps/{}/header.jpg"
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def get_sentiment(review_score: int | None) -> str:
    """Map review score (1-9) to ReviewSentiment enum name."""
    sentiment_map = {
        0: "UNDEFINED",
        1: "OVERWHELMING_NEGATIVE",
        2: "VERY_NEGATIVE",
        3: "NEGATIVE",
        4: "MOSTLY_NEGATIVE",
        5: "MIXED",
        6: "MOSTLY_POSITIVE",
        7: "POSITIVE",
        8: "VERY_POSITIVE",
        9: "OVERWHELMING_POSITIVE",
    }
    if review_score is None or pd.isna(review_score):
        return "UNDEFINED"
    return sentiment_map.get(int(review_score), "UNDEFINED")


def resolve_app_id(row) -> int | None:
    """Get the best available Steam app ID."""
    if pd.notna(row.get("corrected_app_id")):
        return int(row["corrected_app_id"])
    if pd.notna(row.get("app_id")):
        return int(row["app_id"])
    return None


def resolve_name(row) -> str:
    """Get the best available game name."""
    for field in ["name", "title", "found_game_name"]:
        if pd.notna(row.get(field)) and row[field]:
            return str(row[field])
    return "Unknown Game"


def get_thumbnail_url(row) -> str | None:
    """Generate Steam thumbnail URL from app ID."""
    app_id = resolve_app_id(row)
    if app_id:
        return STEAM_THUMBNAIL_TEMPLATE.format(app_id)
    return row.get("thumbnail_url")


def parse_bool(value) -> bool:
    """Parse boolean from various string representations."""
    if pd.isna(value):
        return False
    if isinstance(value, bool):
        return value
    return str(value).lower() in ("true", "1", "yes")


def create_tables(conn: sqlite3.Connection):
    """Create the JPA entity tables."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS canonical_games (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            thumbnail_url TEXT,
            steam_positive INTEGER,
            steam_negative INTEGER,
            steam_sentiment TEXT
        );

        CREATE TABLE IF NOT EXISTS personalized_games (
            id TEXT PRIMARY KEY,
            gamer_id TEXT NOT NULL,
            canonical_game_id TEXT NOT NULL,
            mark_as_played INTEGER NOT NULL DEFAULT 0,
            mark_as_hidden INTEGER NOT NULL DEFAULT 0,
            mark_as_for_later INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_personalized_gamer
            ON personalized_games(gamer_id);
        CREATE INDEX IF NOT EXISTS idx_personalized_canonical
            ON personalized_games(canonical_game_id);
    """)


def convert_parquet_to_sqlite(parquet_path: str, db_path: str):
    """Convert parquet file to SQLite database."""
    print(f"Reading parquet file: {parquet_path}")
    df = pd.read_parquet(parquet_path)
    print(f"Found {len(df)} games")

    # Ensure output directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    # Remove existing database if it exists
    if Path(db_path).exists():
        Path(db_path).unlink()
        print(f"Removed existing database: {db_path}")

    conn = sqlite3.connect(db_path)
    create_tables(conn)

    canonical_games = []
    personalized_games = []

    for _, row in df.iterrows():
        game_id = str(uuid.uuid4())

        # Get Steam rating data
        positive = int(row["total_positive"]) if pd.notna(row.get("total_positive")) else None
        negative = int(row["total_negative"]) if pd.notna(row.get("total_negative")) else None
        review_score = row.get("review_score")
        sentiment = get_sentiment(review_score) if positive is not None else None

        canonical_games.append((
            game_id,
            resolve_name(row),
            get_thumbnail_url(row),
            positive,
            negative,
            sentiment,
        ))

        # Create personalized game entry for test user
        personalized_games.append((
            str(uuid.uuid4()),
            TEST_USER_ID,
            game_id,
            1 if parse_bool(row.get("played")) else 0,
            1 if parse_bool(row.get("hide")) else 0,
            1 if parse_bool(row.get("later")) else 0,
        ))

    # Insert canonical games
    conn.executemany(
        """INSERT INTO canonical_games
           (id, name, thumbnail_url, steam_positive, steam_negative, steam_sentiment)
           VALUES (?, ?, ?, ?, ?, ?)""",
        canonical_games
    )
    print(f"Inserted {len(canonical_games)} canonical games")

    # Insert personalized games
    conn.executemany(
        """INSERT INTO personalized_games
           (id, gamer_id, canonical_game_id, mark_as_played, mark_as_hidden, mark_as_for_later)
           VALUES (?, ?, ?, ?, ?, ?)""",
        personalized_games
    )
    print(f"Inserted {len(personalized_games)} personalized games for test user")

    conn.commit()
    conn.close()

    print(f"\nDatabase created: {db_path}")
    print(f"Size: {Path(db_path).stat().st_size / 1024:.1f} KB")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    parquet_path = sys.argv[1]
    db_path = sys.argv[2] if len(sys.argv) > 2 else "./data/gamedb.sqlite"

    if not Path(parquet_path).exists():
        print(f"Error: Parquet file not found: {parquet_path}")
        sys.exit(1)

    convert_parquet_to_sqlite(parquet_path, db_path)


if __name__ == "__main__":
    main()
