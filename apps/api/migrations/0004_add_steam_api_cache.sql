-- Migration to add Steam API response cache
-- This stores raw Steam API responses for future-proofing and performance

CREATE TABLE steam_api_cache (
    app_id TEXT PRIMARY KEY,
    response_data TEXT NOT NULL, -- JSON string of full Steam API response
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    api_version TEXT DEFAULT 'v1', -- Track which API version was used
    http_status INTEGER, -- HTTP status code from Steam
    error_message TEXT -- Store error if fetch failed
);

-- Index for finding stale cache entries
CREATE INDEX idx_steam_cache_fetched_at ON steam_api_cache(fetched_at);

-- Index for finding failed entries that need retry
CREATE INDEX idx_steam_cache_success ON steam_api_cache(is_successful);
