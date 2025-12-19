package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * Metacritic data for a game.
 *
 * @param score    The Metacritic score (0-100)
 * @param gameName The game's name on Metacritic (may differ from canonical name)
 * @param link     Direct link to the Metacritic page
 */
public record MetacriticGameData(
        @Nullable Integer score,
        @Nullable String gameName,
        @Nullable String link
) implements StoreGameData {

    private static final String METACRITIC_BASE_URL = "https://www.metacritic.com/game/";

    @Override
    public @Nullable String storeId() {
        // Metacritic doesn't use numeric IDs, uses slugified names
        return gameName != null ? slugify(gameName) : null;
    }

    @Override
    public @Nullable String storeName() {
        return gameName;
    }

    @Override
    public @Nullable String storeLink() {
        if (link != null && !link.isBlank()) {
            return link;
        }
        if (gameName != null && !gameName.isBlank()) {
            return METACRITIC_BASE_URL + slugify(gameName);
        }
        return null;
    }

    private static String slugify(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
