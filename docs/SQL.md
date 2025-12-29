
# Helpful commands


## 1. Find duplicate canonical games (same name, different IDs)
SELECT name, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
FROM canonical_games
GROUP BY LOWER(name)
HAVING cnt > 1;

## 2. Find orphaned personalized games (pointing to deleted canonical games)
SELECT p.id, p.canonical_game_id, p.gamer_id
FROM personalized_games p
LEFT JOIN canonical_games c ON p.canonical_game_id = c.id
WHERE c.id IS NULL;

## 3. Find personalized games pointing to duplicate canonical games
SELECT p.canonical_game_id, c.name, COUNT(*) as personal_game_count
FROM personalized_games p
JOIN canonical_games c ON p.canonical_game_id = c.id
WHERE c.name IN (
SELECT name FROM canonical_games GROUP BY LOWER(name) HAVING COUNT(*) > 1
)
GROUP BY p.canonical_game_id, c.name
ORDER BY c.name;
