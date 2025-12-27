package com.robertforpresent.api.scraper.presentation.rest;

import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.scraper.domain.model.EnrichedSearchResult;
import com.robertforpresent.api.scraper.domain.model.GameSearchResult;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.GameCatalogWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST controller for game scraping/search operations.
 */
@Slf4j
@RestController
@RequestMapping("/scraper")
@CrossOrigin(origins = "http://localhost:4200")
public class GameScraperController {
    private final GameScraperService scraperService;

    public GameScraperController(GameScraperService scraperService) {
        this.scraperService = scraperService;
    }

    /**
     * Search for games by name (basic search without library status).
     *
     * @param query The game name to search for
     * @param limit Maximum number of results (default 10, max 20)
     * @return Search results with matching games
     */
    @GetMapping("/search")
    public ResponseEntity<GameSearchResult> searchGames(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        log.debug("Searching for games: '{}'", query);

        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(
                    new GameSearchResult("", java.util.List.of(), "igdb")
            );
        }

        GameSearchResult result = scraperService.searchGames(query.trim(), Math.min(limit, 20));
        log.debug("Found {} results for '{}'", result.results().size(), query);

        return ResponseEntity.ok(result);
    }

    /**
     * Search for games by name with library/catalog status.
     * Results include whether each game is already in the user's library.
     *
     * @param query The game name to search for
     * @param limit Maximum number of results (default 10, max 20)
     * @return Enriched search results with library status
     */
    @GetMapping("/search/enriched")
    public ResponseEntity<EnrichedSearchResult> searchGamesEnriched(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        log.debug("Searching for games with library status: '{}'", query);

        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(
                    new EnrichedSearchResult("", java.util.List.of(), "igdb")
            );
        }

        EnrichedSearchResult result = scraperService.searchGamesWithLibraryStatus(query.trim(), Math.min(limit, 20));
        log.debug("Found {} results for '{}', checking library status", result.results().size(), query);

        return ResponseEntity.ok(result);
    }

    /**
     * Get detailed information for a specific game by IGDB ID.
     *
     * @param igdbId The IGDB game ID
     * @return Game details or 404 if not found
     */
    @GetMapping("/games/{igdbId}")
    public ResponseEntity<ScrapedGameInfo> getGameDetails(@PathVariable long igdbId) {
        log.debug("Fetching game details for IGDB ID: {}", igdbId);

        Optional<ScrapedGameInfo> result = scraperService.getGameDetails(igdbId);

        return result.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Add a game to the user's library by its external ID.
     *
     * @param externalId The IGDB game ID
     * @param userId The user's ID
     * @return Result of the add operation
     */
    @PostMapping("/games/{externalId}/add")
    public ResponseEntity<Map<String, Object>> addGameToLibrary(
            @PathVariable long externalId,
            @RequestParam UUID userId) {
        log.debug("Adding game {} to library for user {}", externalId, userId);

        Optional<GameCatalogWriter.AddGameResult> result = scraperService.addGameToLibrary(externalId, userId);

        return result.map(addResult -> {
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("canonicalGameId", addResult.canonicalGameId().toString());
            response.put("created", addResult.created());
            response.put("message", addResult.created() ? "Game added to catalog and library" : "Game added to library (already in catalog)");
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Check if the scraper service is enabled and properly configured.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean enabled = scraperService.isEnabled();
        String provider = scraperService.getProviderName();
        Map<String, Object> status = new java.util.HashMap<>();
        status.put("enabled", enabled);
        status.put("source", provider);
        status.put("message", enabled
                ? provider.toUpperCase() + " integration is configured and ready"
                : provider.toUpperCase() + " integration is not configured. Set igdb.client-id and igdb.client-secret in application.properties");
        return ResponseEntity.ok(status);
    }
}
