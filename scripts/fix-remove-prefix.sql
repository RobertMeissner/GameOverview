-- SQL Script to fix game names with "REMOVE " prefix (SQLite)
-- This was caused by the Steam licenses import script not filtering removed licenses

-- First, preview which games will be affected
SELECT id, name,
       TRIM(SUBSTR(name, 8)) AS corrected_name
FROM canonical_games
WHERE name LIKE 'Remove %' OR name LIKE 'REMOVE %'
ORDER BY name;

-- Count affected rows
SELECT COUNT(*) AS affected_games
FROM canonical_games
WHERE name LIKE 'Remove %' OR name LIKE 'REMOVE %';

-- Update the game names by removing the "Remove " prefix
UPDATE canonical_games
SET name = TRIM(SUBSTR(name, 8))
WHERE name LIKE 'Remove %' OR name LIKE 'REMOVE %';
