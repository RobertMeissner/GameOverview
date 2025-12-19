package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * Sealed interface for store-specific game data.
 * Each implementation contains the store's ID, name (as it appears on that store), and a link.
 */
public sealed interface StoreGameData permits SteamGameData, GogGameData, MetacriticGameData {
    /**
     * @return The game's ID on this store/platform
     */
    @Nullable String storeId();

    /**
     * @return The game's name as it appears on this store
     */
    @Nullable String storeName();

    /**
     * @return Direct link to the game on this store
     */
    @Nullable String storeLink();
}
