-- SQL Script to set ownership flags for existing games (SQLite)
-- This sets ownership based on what store data exists in canonical_games
-- Run this once to fix existing games, then re-import to get accurate ownership

-- Set Steam ownership for games that have steam_app_id
UPDATE personalized_games
SET owned_on_steam = 1
WHERE canonical_game_id IN (
    SELECT id FROM canonical_games WHERE steam_app_id IS NOT NULL
);

-- Set GOG ownership for games that have gog_id
UPDATE personalized_games
SET owned_on_gog = 1
WHERE canonical_game_id IN (
    SELECT id FROM canonical_games WHERE gog_id IS NOT NULL
);

-- Set Epic ownership for games that have epic_id
UPDATE personalized_games
SET owned_on_epic = 1
WHERE canonical_game_id IN (
    SELECT id FROM canonical_games WHERE epic_id IS NOT NULL
);

-- Verify the updates
SELECT
    (SELECT COUNT(*) FROM personalized_games WHERE owned_on_steam = 1) as steam_owned,
    (SELECT COUNT(*) FROM personalized_games WHERE owned_on_gog = 1) as gog_owned,
    (SELECT COUNT(*) FROM personalized_games WHERE owned_on_epic = 1) as epic_owned;
