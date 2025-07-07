-- Enhanced schema for GameOverview games table
-- Add missing fields to support legacy frontend data structure

-- Add new columns to games table
ALTER TABLE games ADD COLUMN game_hash TEXT;
ALTER TABLE games ADD COLUMN found_game_name TEXT;
ALTER TABLE games ADD COLUMN review_score REAL DEFAULT 0;
ALTER TABLE games ADD COLUMN metacritic_score REAL DEFAULT 0;
ALTER TABLE games ADD COLUMN reviews_rating REAL DEFAULT 0;
ALTER TABLE games ADD COLUMN store_link TEXT;
ALTER TABLE games ADD COLUMN corrected_app_id TEXT;
ALTER TABLE games ADD COLUMN played BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN hide BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN later BOOLEAN DEFAULT FALSE;

-- Create unique game_hash for existing records
UPDATE games SET game_hash = 'game_' || id || '_' || user_id WHERE game_hash IS NULL;

-- Add indexes for performance
CREATE INDEX idx_games_game_hash ON games(game_hash);
CREATE INDEX idx_games_played ON games(played);
CREATE INDEX idx_games_hide ON games(hide);
CREATE INDEX idx_games_later ON games(later);
CREATE INDEX idx_games_review_score ON games(review_score);
CREATE INDEX idx_games_metacritic_score ON games(metacritic_score);
