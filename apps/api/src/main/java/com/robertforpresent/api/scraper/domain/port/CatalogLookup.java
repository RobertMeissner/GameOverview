package com.robertforpresent.api.scraper.domain.port;

import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;

import java.util.Optional;
import java.util.UUID;

/**
 * Port for looking up games in the catalog.
 * Used to check if scraped games already exist in the user's library.
 */
public interface CatalogLookup {

    /**
     * Result of a catalog lookup operation.
     */
    record CatalogMatch(UUID gameId, String matchReason) {}

    /**
     * Find a matching game in the catalog for the given scraped game info.
     * Matches by Steam App ID first, then by exact name.
     *
     * @param gameInfo The scraped game to look up
     * @return Match result if found in catalog
     */
    Optional<CatalogMatch> findMatch(ScrapedGameInfo gameInfo);

    /**
     * Check if a game with the given Steam App ID exists in the catalog.
     *
     * @param steamAppId Steam application ID
     * @return Match result if found
     */
    Optional<CatalogMatch> findBySteamAppId(Integer steamAppId);

    /**
     * Check if a game with the exact name exists in the catalog.
     *
     * @param name Game name
     * @return Match result if found
     */
    Optional<CatalogMatch> findByExactName(String name);
}
