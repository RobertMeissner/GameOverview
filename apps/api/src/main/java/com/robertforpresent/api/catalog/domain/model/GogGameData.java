package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * GOG store data for a game.
 *
 * @param gogId The GOG game ID
 * @param name  The game's name on GOG (may differ from canonical name)
 * @param link  Direct link to the GOG store page (if available)
 */
public record GogGameData(
        @Nullable Long gogId,
        @Nullable String name,
        @Nullable String link
) implements StoreGameData {

    private static final String GOG_STORE_URL = "https://www.gog.com/game/";

    @Override
    public @Nullable String storeId() {
        return gogId != null ? String.valueOf(gogId) : null;
    }

    @Override
    public @Nullable String storeName() {
        return name;
    }

    @Override
    public @Nullable String storeLink() {
        // Use provided link if available, otherwise construct from ID
        if (link != null && !link.isBlank()) {
            return link;
        }
        // Note: GOG links typically use slugified game names, not IDs
        // so we return null if no explicit link is provided
        return null;
    }
}
