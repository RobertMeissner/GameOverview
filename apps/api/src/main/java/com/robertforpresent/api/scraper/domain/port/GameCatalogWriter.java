package com.robertforpresent.api.scraper.domain.port;

import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;

import java.util.UUID;

/**
 * Port for writing games to the catalog.
 * Used to add scraped games to the user's library.
 */
public interface GameCatalogWriter {

    /**
     * Result of adding a game to the catalog.
     */
    record AddGameResult(UUID canonicalGameId, UUID personalizedGameId, boolean created) {}

    /**
     * Add a scraped game to the catalog and user's collection.
     *
     * @param gameInfo The scraped game information
     * @param gamerId The user's ID
     * @return Result containing the created/found game IDs
     */
    AddGameResult addGameToLibrary(ScrapedGameInfo gameInfo, UUID gamerId);
}
