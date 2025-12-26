package com.robertforpresent.api.catalog.presentation.rest;

import org.jspecify.annotations.Nullable;

/**
 * Request for importing a single game from a store.
 */
public record GameImportRequest(
        String name,
        String store,  // "steam", "gog", "epic"
        @Nullable String storeId,
        @Nullable String storeLink,
        @Nullable String thumbnailUrl
) {
}
