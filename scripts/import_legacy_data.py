#!/usr/bin/env python3
"""
One-time import script for legacy parquet data into the GameOverview database.

This script reads the legacy flat parquet file and imports it into the SQLite database
following the new domain model structure:
- CanonicalGame: Store-agnostic game identity with store-specific data
- PersonalizedGame: User-specific data (playtime, ownership, flags)

Usage:
    python import_legacy_data.py <parquet_file> [--db-path <sqlite_db>] [--gamer-id <uuid>]

Example:
    python import_legacy_data.py ~/games_data.parquet --db-path ./data/gamedb.sqlite
"""

import argparse
import hashlib
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd


# =============================================================================
# Domain Models (Python representation of Java domain)
# =============================================================================

@dataclass
class SteamGameData:
    app_id: Optional[int]
    name: Optional[str]
    # Rating data
    positive_reviews: Optional[int] = None
    negative_reviews: Optional[int] = None
    review_sentiment: Optional[str] = None  # e.g., "Mostly Positive"


@dataclass
class GogGameData:
    gog_id: Optional[int]
    name: Optional[str]
    link: Optional[str]
    rating: Optional[int] = None  # reviewsRating (0-100)
    cover_vertical: Optional[str] = None
    cover_horizontal: Optional[str] = None


@dataclass
class MetacriticGameData:
    score: Optional[int]
    game_name: Optional[str]
    link: Optional[str] = None


@dataclass
class HltbGameData:
    """HowLongToBeat data - store-like (game-specific, not user-specific)"""
    hltb_id: Optional[int]
    main_story_hours: Optional[float]
    main_extra_hours: Optional[float]
    completionist_hours: Optional[float]
    similarity: Optional[int] = None  # Match confidence


@dataclass
class CanonicalGame:
    """Store-agnostic game identity aggregating data from multiple sources."""
    id: str  # UUID as string
    name: str
    thumbnail_url: Optional[str]
    release_timestamp: Optional[int]

    # Store-specific data
    steam_data: Optional[SteamGameData] = None
    gog_data: Optional[GogGameData] = None
    metacritic_data: Optional[MetacriticGameData] = None
    hltb_data: Optional[HltbGameData] = None


@dataclass
class PlaytimeData:
    """User's playtime statistics for a game."""
    total_minutes: int = 0
    windows_minutes: int = 0
    mac_minutes: int = 0
    linux_minutes: int = 0
    deck_minutes: int = 0
    disconnected_minutes: int = 0
    last_played_timestamp: Optional[int] = None
    playtime_2weeks_minutes: int = 0


@dataclass
class PersonalizedGame:
    """User-specific game data linked to a CanonicalGame."""
    id: str  # UUID as string
    gamer_id: str
    canonical_game_id: str

    # Ownership
    store_owned: str  # 'steam', 'gog', 'epic', etc.
    cd_key: Optional[str] = None

    # Flags
    marked_as_played: bool = False
    marked_as_hidden: bool = False
    marked_for_later: bool = False

    # User data
    notes: Optional[str] = None
    playtime: Optional[PlaytimeData] = None


# =============================================================================
# Legacy Data Transformation
# =============================================================================

def generate_game_hash(name: str, store: str) -> str:
    """Generate a deterministic hash for deduplication."""
    normalized = f"{name.lower().strip()}:{store.lower()}"
    return hashlib.md5(normalized.encode()).hexdigest()


def determine_canonical_name(row: pd.Series) -> str:
    """Determine the best canonical name from available sources."""
    # Priority: name > title > found_game_name > metacritic_game_name
    candidates = [
        row.get('name'),
        row.get('title'),
        row.get('found_game_name'),
        row.get('metacritic_game_name'),
    ]
    for candidate in candidates:
        if pd.notna(candidate) and str(candidate).strip():
            return str(candidate).strip()
    return "Unknown Game"


def determine_thumbnail_url(row: pd.Series) -> Optional[str]:
    """Determine the best thumbnail URL from available sources."""
    candidates = [
        row.get('thumbnail_url'),
        row.get('coverHorizontal'),
        row.get('coverVertical'),
        row.get('backgroundImage'),
        row.get('img_icon_url'),
    ]
    for candidate in candidates:
        if pd.notna(candidate) and str(candidate).strip():
            return str(candidate).strip()
    return None


def parse_review_sentiment(score: Optional[int], desc: Optional[str]) -> Optional[str]:
    """Parse Steam review sentiment from score or description."""
    if pd.notna(desc):
        return str(desc)
    if pd.notna(score):
        if score >= 95:
            return "Overwhelmingly Positive"
        elif score >= 80:
            return "Very Positive"
        elif score >= 70:
            return "Mostly Positive"
        elif score >= 40:
            return "Mixed"
        elif score >= 20:
            return "Mostly Negative"
        else:
            return "Overwhelmingly Negative"
    return None


def transform_to_canonical_game(row: pd.Series, existing_games: dict) -> Optional[CanonicalGame]:
    """
    Transform a legacy row into a CanonicalGame.

    Uses game_hash for deduplication - if a game with the same hash exists,
    we merge data instead of creating a duplicate.
    """
    name = determine_canonical_name(row)
    store = str(row.get('store', 'unknown')).lower()

    # Check for existing game by hash
    game_hash = row.get('game_hash')
    if pd.isna(game_hash):
        game_hash = generate_game_hash(name, store)

    if game_hash in existing_games:
        # Merge store data into existing game
        existing = existing_games[game_hash]
        _merge_store_data(existing, row, store)
        return None  # Don't create new game

    # Create new canonical game
    game_id = str(uuid.uuid4())

    # Build store-specific data based on source
    steam_data = None
    gog_data = None
    metacritic_data = None
    hltb_data = None

    # Steam data
    app_id = row.get('app_id') or row.get('corrected_app_id')
    if pd.notna(app_id):
        steam_data = SteamGameData(
            app_id=int(app_id),
            name=str(row.get('found_game_name', name)) if pd.notna(row.get('found_game_name')) else name,
            positive_reviews=int(row['total_positive']) if pd.notna(row.get('total_positive')) else None,
            negative_reviews=int(row['total_negative']) if pd.notna(row.get('total_negative')) else None,
            review_sentiment=parse_review_sentiment(
                row.get('review_score'),
                row.get('review_score_desc')
            )
        )

    # GOG data
    gog_id = row.get('gog_id')
    if pd.notna(gog_id):
        gog_data = GogGameData(
            gog_id=int(gog_id),
            name=str(row.get('title', name)) if pd.notna(row.get('title')) else name,
            link=str(row['storeLink']) if pd.notna(row.get('storeLink')) else None,
            rating=int(row['reviewsRating']) if pd.notna(row.get('reviewsRating')) else None,
            cover_vertical=str(row['coverVertical']) if pd.notna(row.get('coverVertical')) else None,
            cover_horizontal=str(row['coverHorizontal']) if pd.notna(row.get('coverHorizontal')) else None,
        )

    # Metacritic data
    mc_score = row.get('metacritic_score')
    if pd.notna(mc_score):
        metacritic_data = MetacriticGameData(
            score=int(mc_score),
            game_name=str(row['metacritic_game_name']) if pd.notna(row.get('metacritic_game_name')) else name,
        )

    # HLTB data
    hltb_id = row.get('hltb_game_id')
    if pd.notna(hltb_id):
        hltb_data = HltbGameData(
            hltb_id=int(hltb_id),
            main_story_hours=float(row['hltb_main_story']) if pd.notna(row.get('hltb_main_story')) else None,
            main_extra_hours=float(row['hltb_main_extra']) if pd.notna(row.get('hltb_main_extra')) else None,
            completionist_hours=float(row['hltb_completionist']) if pd.notna(row.get('hltb_completionist')) else None,
            similarity=int(row['hltb_similarity']) if pd.notna(row.get('hltb_similarity')) else None,
        )

    game = CanonicalGame(
        id=game_id,
        name=name,
        thumbnail_url=determine_thumbnail_url(row),
        release_timestamp=int(row['releaseTimestamp']) if pd.notna(row.get('releaseTimestamp')) else None,
        steam_data=steam_data,
        gog_data=gog_data,
        metacritic_data=metacritic_data,
        hltb_data=hltb_data,
    )

    existing_games[game_hash] = game
    return game


def _merge_store_data(existing: CanonicalGame, row: pd.Series, store: str):
    """Merge store data from a new row into an existing game."""
    # This handles cases where the same game appears multiple times
    # (e.g., owned on both Steam and GOG)

    # Merge Steam data if missing
    if existing.steam_data is None:
        app_id = row.get('app_id') or row.get('corrected_app_id')
        if pd.notna(app_id):
            existing.steam_data = SteamGameData(
                app_id=int(app_id),
                name=str(row.get('found_game_name')) if pd.notna(row.get('found_game_name')) else existing.name,
                positive_reviews=int(row['total_positive']) if pd.notna(row.get('total_positive')) else None,
                negative_reviews=int(row['total_negative']) if pd.notna(row.get('total_negative')) else None,
                review_sentiment=parse_review_sentiment(row.get('review_score'), row.get('review_score_desc'))
            )

    # Merge GOG data if missing
    if existing.gog_data is None:
        gog_id = row.get('gog_id')
        if pd.notna(gog_id):
            existing.gog_data = GogGameData(
                gog_id=int(gog_id),
                name=str(row.get('title')) if pd.notna(row.get('title')) else existing.name,
                link=str(row['storeLink']) if pd.notna(row.get('storeLink')) else None,
                rating=int(row['reviewsRating']) if pd.notna(row.get('reviewsRating')) else None,
            )

    # Merge Metacritic data if missing
    if existing.metacritic_data is None:
        mc_score = row.get('metacritic_score')
        if pd.notna(mc_score):
            existing.metacritic_data = MetacriticGameData(
                score=int(mc_score),
                game_name=str(row['metacritic_game_name']) if pd.notna(row.get('metacritic_game_name')) else existing.name,
            )

    # Merge HLTB data if missing
    if existing.hltb_data is None:
        hltb_id = row.get('hltb_game_id')
        if pd.notna(hltb_id):
            existing.hltb_data = HltbGameData(
                hltb_id=int(hltb_id),
                main_story_hours=float(row['hltb_main_story']) if pd.notna(row.get('hltb_main_story')) else None,
                main_extra_hours=float(row['hltb_main_extra']) if pd.notna(row.get('hltb_main_extra')) else None,
                completionist_hours=float(row['hltb_completionist']) if pd.notna(row.get('hltb_completionist')) else None,
            )


def transform_to_personalized_game(
    row: pd.Series,
    canonical_game_id: str,
    gamer_id: str
) -> PersonalizedGame:
    """Transform user-specific data from a legacy row into a PersonalizedGame."""

    playtime = PlaytimeData(
        total_minutes=int(row['playtime_forever']) if pd.notna(row.get('playtime_forever')) else 0,
        windows_minutes=int(row['playtime_windows_forever']) if pd.notna(row.get('playtime_windows_forever')) else 0,
        mac_minutes=int(row['playtime_mac_forever']) if pd.notna(row.get('playtime_mac_forever')) else 0,
        linux_minutes=int(row['playtime_linux_forever']) if pd.notna(row.get('playtime_linux_forever')) else 0,
        deck_minutes=int(row['playtime_deck_forever']) if pd.notna(row.get('playtime_deck_forever')) else 0,
        disconnected_minutes=int(row['playtime_disconnected']) if pd.notna(row.get('playtime_disconnected')) else 0,
        last_played_timestamp=int(row['rtime_last_played']) if pd.notna(row.get('rtime_last_played')) else None,
        playtime_2weeks_minutes=int(row['playtime_2weeks']) if pd.notna(row.get('playtime_2weeks')) else 0,
    )

    return PersonalizedGame(
        id=str(uuid.uuid4()),
        gamer_id=gamer_id,
        canonical_game_id=canonical_game_id,
        store_owned=str(row.get('store', 'unknown')).lower(),
        cd_key=str(row['cdKey']) if pd.notna(row.get('cdKey')) else None,
        marked_as_played=bool(row.get('played', False)) if pd.notna(row.get('played')) else False,
        marked_as_hidden=bool(row.get('hide', False)) if pd.notna(row.get('hide')) else False,
        marked_for_later=bool(row.get('later', False)) if pd.notna(row.get('later')) else False,
        notes=str(row['textInformation']) if pd.notna(row.get('textInformation')) else None,
        playtime=playtime,
    )


# =============================================================================
# Database Operations
# =============================================================================

def get_existing_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    """Get the set of existing column names for a table."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def add_column_if_missing(conn: sqlite3.Connection, table: str, column: str, col_type: str, default: str = None):
    """Add a column to a table if it doesn't exist."""
    existing = get_existing_columns(conn, table)
    if column not in existing:
        default_clause = f" DEFAULT {default}" if default else ""
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}")
        print(f"  Added column: {table}.{column}")


def create_tables(conn: sqlite3.Connection):
    """Create database tables if they don't exist, and migrate existing tables."""
    cursor = conn.cursor()

    # Check if canonical_games table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='canonical_games'")
    table_exists = cursor.fetchone() is not None

    if not table_exists:
        # Create fresh table with full schema
        cursor.execute("""
            CREATE TABLE canonical_games (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                thumbnail_url TEXT,
                release_timestamp INTEGER,

            -- Steam data
            steam_app_id INTEGER,
            steam_name TEXT,
            steam_positive INTEGER,
            steam_negative INTEGER,
            steam_sentiment TEXT,

            -- GOG data
            gog_id INTEGER,
            gog_name TEXT,
            gog_link TEXT,
            gog_rating INTEGER,
            gog_cover_vertical TEXT,
            gog_cover_horizontal TEXT,

            -- Metacritic data
            metacritic_score INTEGER,
            metacritic_name TEXT,
            metacritic_link TEXT,

            -- HLTB data
            hltb_id INTEGER,
            hltb_main_story_hours REAL,
            hltb_main_extra_hours REAL,
            hltb_completionist_hours REAL,
            hltb_similarity INTEGER,

                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
    else:
        # Migrate existing table - add new columns if missing
        print("Migrating canonical_games table...")
        # Note: SQLite doesn't allow non-constant defaults in ALTER TABLE,
        # so created_at/updated_at will be NULL for migrated rows (acceptable)
        new_columns = [
            ("release_timestamp", "INTEGER", None),
            ("steam_positive", "INTEGER", None),
            ("steam_negative", "INTEGER", None),
            ("steam_sentiment", "TEXT", None),
            ("gog_rating", "INTEGER", None),
            ("gog_cover_vertical", "TEXT", None),
            ("gog_cover_horizontal", "TEXT", None),
            ("hltb_id", "INTEGER", None),
            ("hltb_main_story_hours", "REAL", None),
            ("hltb_main_extra_hours", "REAL", None),
            ("hltb_completionist_hours", "REAL", None),
            ("hltb_similarity", "INTEGER", None),
            ("created_at", "TEXT", None),
            ("updated_at", "TEXT", None),
        ]
        for col_name, col_type, default in new_columns:
            add_column_if_missing(conn, "canonical_games", col_name, col_type, default)

    # PersonalizedGame table - check if exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='personalized_games'")
    pg_table_exists = cursor.fetchone() is not None

    if not pg_table_exists:
        cursor.execute("""
            CREATE TABLE personalized_games (
                id TEXT PRIMARY KEY,
                gamer_id TEXT NOT NULL,
                canonical_game_id TEXT NOT NULL,

            -- Ownership
            store_owned TEXT,
            cd_key TEXT,

            -- Flags
            mark_as_played INTEGER DEFAULT 0,
            mark_as_hidden INTEGER DEFAULT 0,
            mark_as_for_later INTEGER DEFAULT 0,

            -- User data
            notes TEXT,

            -- Playtime
            playtime_total_minutes INTEGER DEFAULT 0,
            playtime_windows_minutes INTEGER DEFAULT 0,
            playtime_mac_minutes INTEGER DEFAULT 0,
            playtime_linux_minutes INTEGER DEFAULT 0,
            playtime_deck_minutes INTEGER DEFAULT 0,
            playtime_disconnected_minutes INTEGER DEFAULT 0,
            playtime_last_played_timestamp INTEGER,
            playtime_2weeks_minutes INTEGER DEFAULT 0,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (canonical_game_id) REFERENCES canonical_games(id)
            )
        """)
    else:
        # Migrate existing table - add new columns if missing
        # Note: SQLite doesn't allow non-constant defaults in ALTER TABLE
        print("Migrating personalized_games table...")
        new_pg_columns = [
            ("store_owned", "TEXT", None),
            ("cd_key", "TEXT", None),
            ("notes", "TEXT", None),
            ("playtime_total_minutes", "INTEGER", "0"),
            ("playtime_windows_minutes", "INTEGER", "0"),
            ("playtime_mac_minutes", "INTEGER", "0"),
            ("playtime_linux_minutes", "INTEGER", "0"),
            ("playtime_deck_minutes", "INTEGER", "0"),
            ("playtime_disconnected_minutes", "INTEGER", "0"),
            ("playtime_last_played_timestamp", "INTEGER", None),
            ("playtime_2weeks_minutes", "INTEGER", "0"),
            ("created_at", "TEXT", None),
            ("updated_at", "TEXT", None),
        ]
        for col_name, col_type, default in new_pg_columns:
            add_column_if_missing(conn, "personalized_games", col_name, col_type, default)

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_canonical_steam_id ON canonical_games(steam_app_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_canonical_gog_id ON canonical_games(gog_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_personalized_gamer ON personalized_games(gamer_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_personalized_canonical ON personalized_games(canonical_game_id)")

    conn.commit()


def insert_canonical_game(conn: sqlite3.Connection, game: CanonicalGame):
    """Insert a CanonicalGame into the database."""
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO canonical_games (
            id, name, thumbnail_url, release_timestamp,
            steam_app_id, steam_name, steam_positive, steam_negative, steam_sentiment,
            gog_id, gog_name, gog_link, gog_rating, gog_cover_vertical, gog_cover_horizontal,
            metacritic_score, metacritic_name, metacritic_link,
            hltb_id, hltb_main_story_hours, hltb_main_extra_hours, hltb_completionist_hours, hltb_similarity,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        game.id,
        game.name,
        game.thumbnail_url,
        game.release_timestamp,
        game.steam_data.app_id if game.steam_data else None,
        game.steam_data.name if game.steam_data else None,
        game.steam_data.positive_reviews if game.steam_data else None,
        game.steam_data.negative_reviews if game.steam_data else None,
        game.steam_data.review_sentiment if game.steam_data else None,
        game.gog_data.gog_id if game.gog_data else None,
        game.gog_data.name if game.gog_data else None,
        game.gog_data.link if game.gog_data else None,
        game.gog_data.rating if game.gog_data else None,
        game.gog_data.cover_vertical if game.gog_data else None,
        game.gog_data.cover_horizontal if game.gog_data else None,
        game.metacritic_data.score if game.metacritic_data else None,
        game.metacritic_data.game_name if game.metacritic_data else None,
        game.metacritic_data.link if game.metacritic_data else None,
        game.hltb_data.hltb_id if game.hltb_data else None,
        game.hltb_data.main_story_hours if game.hltb_data else None,
        game.hltb_data.main_extra_hours if game.hltb_data else None,
        game.hltb_data.completionist_hours if game.hltb_data else None,
        game.hltb_data.similarity if game.hltb_data else None,
    ))


def insert_personalized_game(conn: sqlite3.Connection, game: PersonalizedGame):
    """Insert a PersonalizedGame into the database."""
    cursor = conn.cursor()

    playtime = game.playtime or PlaytimeData()

    cursor.execute("""
        INSERT OR REPLACE INTO personalized_games (
            id, gamer_id, canonical_game_id,
            store_owned, cd_key,
            mark_as_played, mark_as_hidden, mark_as_for_later,
            notes,
            playtime_total_minutes, playtime_windows_minutes, playtime_mac_minutes,
            playtime_linux_minutes, playtime_deck_minutes, playtime_disconnected_minutes,
            playtime_last_played_timestamp, playtime_2weeks_minutes,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        game.id,
        game.gamer_id,
        game.canonical_game_id,
        game.store_owned,
        game.cd_key,
        1 if game.marked_as_played else 0,
        1 if game.marked_as_hidden else 0,
        1 if game.marked_for_later else 0,
        game.notes,
        playtime.total_minutes,
        playtime.windows_minutes,
        playtime.mac_minutes,
        playtime.linux_minutes,
        playtime.deck_minutes,
        playtime.disconnected_minutes,
        playtime.last_played_timestamp,
        playtime.playtime_2weeks_minutes,
    ))


# =============================================================================
# Main Import Logic
# =============================================================================

def import_legacy_data(
    parquet_path: Path,
    db_path: Path,
    gamer_id: str,
    dry_run: bool = False
):
    """
    Import legacy parquet data into the database.

    Args:
        parquet_path: Path to the legacy parquet file
        db_path: Path to SQLite database
        gamer_id: UUID for the user (owner of the game library)
        dry_run: If True, don't write to database
    """
    print(f"Loading parquet file: {parquet_path}")
    df = pd.read_parquet(parquet_path)
    print(f"Loaded {len(df)} rows")

    # Print schema for verification
    print("\nParquet schema:")
    print(df.dtypes.to_string())
    print()

    # Track games by hash for deduplication
    canonical_games: dict[str, CanonicalGame] = {}
    personalized_games: list[PersonalizedGame] = []

    # Row-to-canonical-game mapping for personalized game creation
    row_to_canonical: dict[int, str] = {}

    print("Transforming data...")
    for idx, row in df.iterrows():
        game = transform_to_canonical_game(row, canonical_games)

        # Determine which canonical game this row maps to
        name = determine_canonical_name(row)
        store = str(row.get('store', 'unknown')).lower()
        game_hash = row.get('game_hash')
        if pd.isna(game_hash):
            game_hash = generate_game_hash(name, store)

        canonical_game_id = canonical_games[game_hash].id
        row_to_canonical[idx] = canonical_game_id

        # Create personalized game entry
        personalized = transform_to_personalized_game(row, canonical_game_id, gamer_id)
        personalized_games.append(personalized)

    print(f"\nDeduplication results:")
    print(f"  Original rows: {len(df)}")
    print(f"  Unique canonical games: {len(canonical_games)}")
    print(f"  Personalized entries: {len(personalized_games)}")

    if dry_run:
        print("\n[DRY RUN] Would insert the following:")
        print(f"  - {len(canonical_games)} canonical games")
        print(f"  - {len(personalized_games)} personalized games")

        # Print sample data
        print("\nSample canonical game:")
        sample = next(iter(canonical_games.values()))
        print(f"  Name: {sample.name}")
        print(f"  Steam: {sample.steam_data}")
        print(f"  GOG: {sample.gog_data}")
        print(f"  Metacritic: {sample.metacritic_data}")
        print(f"  HLTB: {sample.hltb_data}")
        return

    # Create database and insert
    print(f"\nConnecting to database: {db_path}")
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        create_tables(conn)

        print("Inserting canonical games...")
        for game in canonical_games.values():
            insert_canonical_game(conn, game)

        print("Inserting personalized games...")
        for game in personalized_games:
            insert_personalized_game(conn, game)

        conn.commit()
        print(f"\nSuccessfully imported:")
        print(f"  - {len(canonical_games)} canonical games")
        print(f"  - {len(personalized_games)} personalized games")

    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(
        description="Import legacy parquet game data into GameOverview database"
    )
    parser.add_argument(
        "parquet_file",
        type=Path,
        help="Path to the legacy parquet file"
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path("./data/gamedb.sqlite"),
        help="Path to SQLite database (default: ./data/gamedb.sqlite)"
    )
    parser.add_argument(
        "--gamer-id",
        type=str,
        default=str(uuid.uuid4()),
        help="UUID for the gamer/user (default: generates new UUID)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without writing to database"
    )

    args = parser.parse_args()

    if not args.parquet_file.exists():
        print(f"Error: Parquet file not found: {args.parquet_file}")
        return 1

    print(f"Gamer ID: {args.gamer_id}")

    import_legacy_data(
        parquet_path=args.parquet_file,
        db_path=args.db_path,
        gamer_id=args.gamer_id,
        dry_run=args.dry_run,
    )

    return 0


if __name__ == "__main__":
    exit(main())
