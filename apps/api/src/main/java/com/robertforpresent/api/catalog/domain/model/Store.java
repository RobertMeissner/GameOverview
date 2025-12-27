package com.robertforpresent.api.catalog.domain.model;

import java.util.UUID;

/**
 * Domain model representing a game store/platform.
 * Stores metadata about each store for display and lookup purposes.
 */
public record Store(
    UUID id,
    String code,           // e.g., "steam", "gog", "epic", "family"
    String name,           // e.g., "Steam", "GOG", "Epic Games", "Steam Family Sharing"
    String url,            // e.g., "https://store.steampowered.com"
    String iconUrl,        // Optional icon URL
    boolean active         // Whether the store is currently active
) {
    /**
     * Creates a new Store with a generated UUID.
     */
    public static Store create(String code, String name, String url, String iconUrl) {
        return new Store(UUID.randomUUID(), code, name, url, iconUrl, true);
    }
}
