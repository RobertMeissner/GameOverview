package com.robertforpresent.api.catalog.application.command;

import org.jspecify.annotations.Nullable;

/**
 * Command for importing a game from a store.
 * Application layer command - decoupled from presentation layer.
 */
public record ImportGameCommand(
        String name,
        String store,
        @Nullable String storeId,
        @Nullable String storeLink,
        @Nullable String thumbnailUrl
) {
}
