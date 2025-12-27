package com.robertforpresent.api.scraper.application.service;

import com.robertforpresent.api.scraper.domain.model.EnrichedGameInfo;
import com.robertforpresent.api.scraper.domain.model.EnrichedSearchResult;
import com.robertforpresent.api.scraper.domain.model.GameSearchResult;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import com.robertforpresent.api.scraper.domain.port.GameCatalogWriter;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    private final CatalogLookup catalogLookup;
    private final GameCatalogWriter catalogWriter;

    public GameScraperService(
            GameInfoProvider gameInfoProvider,
            CatalogLookup catalogLookup,
            GameCatalogWriter catalogWriter) {
        this.gameInfoProvider = gameInfoProvider;
        this.catalogLookup = catalogLookup;
        this.catalogWriter = catalogWriter;
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
     * Searches for games by name and enriches results with catalog/library status.
     *
     * @param query The game name to search for
     * @param limit Maximum number of results to return
     * @return Enriched search results with library status for each game
     */
    public EnrichedSearchResult searchGamesWithLibraryStatus(String query, int limit) {
        log.info("Searching for games with library status: '{}' via {}", query, gameInfoProvider.getProviderName());

        List<ScrapedGameInfo> results = gameInfoProvider.searchGames(query, limit);
        List<EnrichedGameInfo> enrichedResults = results.stream()
                .map(this::enrichWithCatalogStatus)
                .toList();

        long inLibraryCount = enrichedResults.stream().filter(EnrichedGameInfo::inLibrary).count();
        log.info("Found {} results for '{}', {} already in library", results.size(), query, inLibraryCount);

        return new EnrichedSearchResult(query, enrichedResults, gameInfoProvider.getProviderName());
    }

    private EnrichedGameInfo enrichWithCatalogStatus(ScrapedGameInfo gameInfo) {
        return catalogLookup.findMatch(gameInfo)
                .map(match -> EnrichedGameInfo.inLibrary(gameInfo, match.gameId(), match.matchReason()))
                .orElseGet(() -> EnrichedGameInfo.notInLibrary(gameInfo));
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

    /**
     * Fetches game details by external ID and adds it to the user's library.
     *
     * @param externalId The provider-specific game ID
     * @param gamerId The user's ID
     * @return Result of the add operation, or empty if game not found
     */
    public Optional<GameCatalogWriter.AddGameResult> addGameToLibrary(long externalId, UUID gamerId) {
        log.info("Adding game {} to library for user {}", externalId, gamerId);

        return gameInfoProvider.getGameDetails(externalId)
                .map(gameInfo -> catalogWriter.addGameToLibrary(gameInfo, gamerId));
    }

    /**
     * Adds a game directly from scraped info to the user's library.
     *
     * @param gameInfo The scraped game information
     * @param gamerId The user's ID
     * @return Result of the add operation
     */
    public GameCatalogWriter.AddGameResult addGameToLibrary(ScrapedGameInfo gameInfo, UUID gamerId) {
        log.info("Adding game '{}' to library for user {}", gameInfo.name(), gamerId);
        return catalogWriter.addGameToLibrary(gameInfo, gamerId);
    }
}
