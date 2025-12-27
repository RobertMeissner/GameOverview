package com.robertforpresent.api.scraper.application.service;

import com.robertforpresent.api.scraper.domain.model.GameSearchResult;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Application service for game scraping operations.
 *
 * This service orchestrates game search and retrieval operations
 * using the GameInfoProvider port. It is agnostic to the specific
 * provider implementation (IGDB, RAWG, etc.).
 *
 * <h2>Architecture</h2>
 * <p>Follows hexagonal architecture by depending on the port interface
 * rather than concrete implementations. The actual provider (IGDB, etc.)
 * is injected at runtime.</p>
 */
@Service
@Slf4j
public class GameScraperService {
    private final GameInfoProvider gameInfoProvider;

    public GameScraperService(GameInfoProvider gameInfoProvider) {
        this.gameInfoProvider = gameInfoProvider;
    }

    /**
     * Searches for games by name.
     *
     * @param query The game name to search for
     * @param limit Maximum number of results to return
     * @return Search results containing matching games
     */
    public GameSearchResult searchGames(String query, int limit) {
        log.info("Searching for games: '{}' via {}", query, gameInfoProvider.getProviderName());

        List<ScrapedGameInfo> results = gameInfoProvider.searchGames(query, limit);

        log.info("Found {} results for '{}'", results.size(), query);
        return new GameSearchResult(query, results, gameInfoProvider.getProviderName());
    }

    /**
     * Gets detailed information for a specific game by external ID.
     *
     * @param externalId The provider-specific game ID
     * @return Game details if found
     */
    public Optional<ScrapedGameInfo> getGameDetails(long externalId) {
        log.info("Fetching game details for ID: {} via {}", externalId, gameInfoProvider.getProviderName());
        return gameInfoProvider.getGameDetails(externalId);
    }

    /**
     * Checks if the game info provider is enabled and properly configured.
     *
     * @return true if the provider is ready to use
     */
    public boolean isEnabled() {
        return gameInfoProvider.isEnabled();
    }

    /**
     * Gets the name of the active provider.
     *
     * @return Provider identifier
     */
    public String getProviderName() {
        return gameInfoProvider.getProviderName();
    }
}
