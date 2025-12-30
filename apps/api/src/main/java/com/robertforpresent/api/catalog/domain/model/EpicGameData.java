package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * Store data for Epic Games.
 */
public record EpicGameData(
        @Nullable String epicId,
        @Nullable String name,
        @Nullable String link
) {
    private static final String EPIC_STORE_URL = "https://store.epicgames.com/p/";

    public @Nullable String storeLink() {
        // If we have a link, check if it contains a UUID-like ID (bad IGDB data)
        if (link != null) {
            String id = extractIdFromLink(link);
            if (id != null && !isUuidLike(id)) {
                return link;
            }
            // Fall through to try epicId or name-based search
        }

        // If we have an epicId that's not a UUID, use it
        if (epicId != null && !isUuidLike(epicId)) {
            return EPIC_STORE_URL + epicId;
        }

        // Fall back to search URL using the Epic name if available
        if (name != null && !name.isBlank()) {
            return "https://store.epicgames.com/browse?q=" + name.replace(" ", "%20");
        }

        return null;
    }

    /**
     * Detects if a string looks like a UUID or hex ID (32 hex chars).
     * Examples: "d4b6a615ea794a6295d34608c5426d4f" or "d4b6a615-ea79-4a62-95d3-4608c5426d4f"
     */
    private boolean isUuidLike(String id) {
        if (id == null) return false;
        // Remove dashes and check if it's 32 hex characters
        String normalized = id.replace("-", "");
        return normalized.length() == 32 && normalized.matches("[0-9a-fA-F]+");
    }

    /**
     * Extracts the game ID/slug from an Epic Games URL.
     */
    private @Nullable String extractIdFromLink(String url) {
        if (url == null) return null;
        int idx = url.indexOf("/p/");
        if (idx >= 0 && idx + 3 < url.length()) {
            String id = url.substring(idx + 3);
            // Remove query params and trailing slashes
            int end = id.indexOf('?');
            if (end < 0) end = id.indexOf('/');
            if (end < 0) end = id.indexOf('#');
            return end > 0 ? id.substring(0, end) : id;
        }
        return null;
    }
}
