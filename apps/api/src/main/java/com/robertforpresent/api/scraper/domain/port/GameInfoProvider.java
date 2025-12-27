package com.robertforpresent.api.scraper.domain.port;

import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;

import java.util.List;
import java.util.Optional;

/**
 * Port for external game information providers.
 *
 * This interface defines the contract for fetching game information
 * from external sources (IGDB, RAWG, etc.) following hexagonal architecture.
 * Implementations (adapters) live in the infrastructure layer.
 */
public interface GameInfoProvider {

    /**
     * Search for games by name.
     *
     * @param query The game name to search for
     * @param limit Maximum number of results to return
     * @return List of matching games
     */
    List<ScrapedGameInfo> searchGames(String query, int limit);

    /**
     * Get detailed information for a specific game.
     *
     * @param externalId The provider-specific game ID
     * @return Game details if found
     */
    Optional<ScrapedGameInfo> getGameDetails(long externalId);

    /**
     * Check if this provider is enabled and properly configured.
     *
     * @return true if the provider is ready to use
     */
    boolean isEnabled();

    /**
     * Get the name of this provider (e.g., "igdb", "rawg").
     *
     * @return Provider identifier
     */
    String getProviderName();
}
