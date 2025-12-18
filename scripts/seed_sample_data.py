#!/usr/bin/env python3
"""
Create a sample SQLite database with test game data.

Usage:
    python seed_sample_data.py [output_db]

Example:
    python seed_sample_data.py ../apps/api/data/gamedb.sqlite
"""

import sqlite3
import sys
import uuid
from pathlib import Path


TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

SAMPLE_GAMES = [
    {"name": "Portal 2", "app_id": 620, "positive": 350000, "negative": 5000, "sentiment": "OVERWHELMING_POSITIVE", "played": True},
    {"name": "Half-Life 2", "app_id": 220, "positive": 180000, "negative": 3000, "sentiment": "OVERWHELMING_POSITIVE", "played": True},
    {"name": "The Witcher 3", "app_id": 292030, "positive": 600000, "negative": 20000, "sentiment": "OVERWHELMING_POSITIVE", "played": False},
    {"name": "Stardew Valley", "app_id": 413150, "positive": 500000, "negative": 5000, "sentiment": "OVERWHELMING_POSITIVE", "played": False},
    {"name": "Hades", "app_id": 1145360, "positive": 200000, "negative": 2000, "sentiment": "OVERWHELMING_POSITIVE", "played": True},
    {"name": "Celeste", "app_id": 504230, "positive": 55000, "negative": 500, "sentiment": "OVERWHELMING_POSITIVE", "played": False},
    {"name": "Hollow Knight", "app_id": 367520, "positive": 180000, "negative": 3000, "sentiment": "OVERWHELMING_POSITIVE", "played": True},
    {"name": "Disco Elysium", "app_id": 632470, "positive": 65000, "negative": 4000, "sentiment": "VERY_POSITIVE", "played": False},
    {"name": "Factorio", "app_id": 427520, "positive": 140000, "negative": 1000, "sentiment": "OVERWHELMING_POSITIVE", "played": False},
    {"name": "Terraria", "app_id": 105600, "positive": 950000, "negative": 15000, "sentiment": "OVERWHELMING_POSITIVE", "played": True},
]

STEAM_THUMBNAIL_TEMPLATE = "https://steamcdn-a.akamaihd.net/steam/apps/{}/header.jpg"


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


def seed_sample_data(db_path: str):
    """Create sample database with test games."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    if Path(db_path).exists():
        Path(db_path).unlink()
        print(f"Removed existing database: {db_path}")

    conn = sqlite3.connect(db_path)
    create_tables(conn)

    canonical_games = []
    personalized_games = []

    for game in SAMPLE_GAMES:
        game_id = str(uuid.uuid4())
        thumbnail_url = STEAM_THUMBNAIL_TEMPLATE.format(game["app_id"])

        canonical_games.append((
            game_id,
            game["name"],
            thumbnail_url,
            game["positive"],
            game["negative"],
            game["sentiment"],
        ))

        personalized_games.append((
            str(uuid.uuid4()),
            TEST_USER_ID,
            game_id,
            1 if game.get("played") else 0,
            0,  # hidden
            0,  # for later
        ))

    conn.executemany(
        """INSERT INTO canonical_games
           (id, name, thumbnail_url, steam_positive, steam_negative, steam_sentiment)
           VALUES (?, ?, ?, ?, ?, ?)""",
        canonical_games
    )

    conn.executemany(
        """INSERT INTO personalized_games
           (id, gamer_id, canonical_game_id, mark_as_played, mark_as_hidden, mark_as_for_later)
           VALUES (?, ?, ?, ?, ?, ?)""",
        personalized_games
    )

    conn.commit()
    conn.close()

    print(f"Created database: {db_path}")
    print(f"Inserted {len(canonical_games)} sample games")
    print(f"Size: {Path(db_path).stat().st_size / 1024:.1f} KB")


def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "./data/gamedb.sqlite"
    seed_sample_data(db_path)


if __name__ == "__main__":
    main()
