-- Migration to convert user IDs from integers to UUIDs
-- This migration will:
-- 1. Add new UUID columns
-- 2. Generate UUIDs for existing users
-- 3. Update foreign key references
-- 4. Drop old integer columns
-- 5. Rename UUID columns to replace old ones

-- Step 1: Add new UUID columns
ALTER TABLE users ADD COLUMN uuid_id TEXT;
ALTER TABLE games ADD COLUMN user_uuid TEXT;

-- Step 2: Generate UUIDs for existing users (using a simple UUID v4 format)
-- Note: In a real migration, you'd want to use proper UUID generation
-- For this example, we'll create deterministic UUIDs based on existing IDs
UPDATE users SET uuid_id =
  CASE
    WHEN id = 1 THEN '550e8400-e29b-41d4-a716-446655440001'
    WHEN id = 2 THEN '550e8400-e29b-41d4-a716-446655440002'
    WHEN id = 3 THEN '550e8400-e29b-41d4-a716-446655440003'
    WHEN id = 4 THEN '550e8400-e29b-41d4-a716-446655440004'
    WHEN id = 5 THEN '550e8400-e29b-41d4-a716-446655440005'
    ELSE '550e8400-e29b-41d4-a716-44665544' || printf('%04d', id)
  END;

-- Step 3: Update games table to use UUIDs
UPDATE games SET user_uuid = (
  SELECT uuid_id FROM users WHERE users.id = games.user_id
);

-- Step 4: Create new tables with UUID primary keys
CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    app_id TEXT,
    store TEXT NOT NULL CHECK (store IN ('steam', 'gog', 'epic', 'other')),
    thumbnail_url TEXT,
    rating REAL,
    notes TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_played DATETIME,
    playtime_hours REAL DEFAULT 0,
    status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'playing', 'completed', 'dropped', 'wishlist')),
    -- Enhanced fields
    game_hash TEXT,
    found_game_name TEXT,
    review_score REAL DEFAULT 0,
    metacritic_score REAL DEFAULT 0,
    reviews_rating REAL DEFAULT 0,
    store_link TEXT,
    corrected_app_id TEXT,
    played BOOLEAN DEFAULT FALSE,
    hide BOOLEAN DEFAULT FALSE,
    later BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users_new (id) ON DELETE CASCADE
);

-- Step 5: Copy data to new tables
INSERT INTO users_new (id, email, password_hash, username, created_at, updated_at)
SELECT uuid_id, email, password_hash, username, created_at, updated_at FROM users;

INSERT INTO games_new (
    id, user_id, name, app_id, store, thumbnail_url, rating, notes,
    date_added, last_played, playtime_hours, status, game_hash,
    found_game_name, review_score, metacritic_score, reviews_rating,
    store_link, corrected_app_id, played, hide, later
)
SELECT
    id, user_uuid, name, app_id, store, thumbnail_url, rating, notes,
    date_added, last_played, playtime_hours, status, game_hash,
    found_game_name, review_score, metacritic_score, reviews_rating,
    store_link, corrected_app_id, played, hide, later
FROM games;

-- Step 6: Drop old tables and rename new ones
DROP TABLE games;
DROP TABLE users;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE games_new RENAME TO games;

-- Step 7: Recreate indexes
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_store ON games(store);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_game_hash ON games(game_hash);
CREATE INDEX idx_games_played ON games(played);
CREATE INDEX idx_games_hide ON games(hide);
CREATE INDEX idx_games_later ON games(later);
CREATE INDEX idx_games_review_score ON games(review_score);
CREATE INDEX idx_games_metacritic_score ON games(metacritic_score);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
