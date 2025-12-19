package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * Steam store data for a game.
 *
 * @param appId The Steam app ID
 * @param name  The game's name on Steam (may differ from canonical name)
 */
public record SteamGameData(
        @Nullable Integer appId,
        @Nullable String name
) implements StoreGameData {

    private static final String STEAM_STORE_URL = "https://store.steampowered.com/app/";

    @Override
    public @Nullable String storeId() {
        return appId != null ? String.valueOf(appId) : null;
    }

    @Override
    public @Nullable String storeName() {
        return name;
    }

    @Override
    public @Nullable String storeLink() {
        return appId != null ? STEAM_STORE_URL + appId : null;
    }
}
