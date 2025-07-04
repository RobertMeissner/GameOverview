-- Initial schema for GameOverview
-- Users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Games table for user's game library
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_store ON games(store);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
