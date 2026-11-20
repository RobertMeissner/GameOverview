/* (C)2026 */
package com.robertforpresent.api.catalog.domain.port;

import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import java.util.Optional;

/**
 * Port for querying external game catalogs (e.g. IGDB) from the catalog module.
 */
public interface ScrapingPort {

    /**
     * Search for a game by name and return the first result.
     */
    Optional<ScrapedGameInfo> findFirstByName(String name);

    /**
     * Get detailed information for a specific external ID.
     */
    Optional<ScrapedGameInfo> getGameDetails(long externalId);
}
