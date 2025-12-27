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
    public @Nullable String storeLink() {
        if (link != null) {
            return link;
        }
        if (epicId != null) {
            return "https://store.epicgames.com/p/" + epicId;
        }
        return null;
    }
}
