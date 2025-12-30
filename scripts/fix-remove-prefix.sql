-- SQL Script to fix game names with "REMOVE " prefix
-- This was caused by the Steam licenses import script not filtering removed licenses

-- First, preview which games will be affected
SELECT id, name,
       TRIM(SUBSTRING(name FROM 8)) AS corrected_name
FROM canonical_games
WHERE UPPER(name) LIKE 'REMOVE %'
ORDER BY name;

-- Count affected rows
SELECT COUNT(*) AS affected_games
FROM canonical_games
WHERE UPPER(name) LIKE 'REMOVE %';

-- Update the game names by removing the "Remove " prefix (case-insensitive)
-- Uncomment the UPDATE statement below after verifying the SELECT results

-- UPDATE canonical_games
-- SET name = TRIM(SUBSTRING(name FROM 8))
-- WHERE UPPER(name) LIKE 'REMOVE %';

-- Verify the fix (should return 0 after running UPDATE)
-- SELECT COUNT(*) FROM canonical_games WHERE UPPER(name) LIKE 'REMOVE %';
