package com.robertforpresent.api.scraper.presentation.rest;

import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.scraper.domain.model.GameSearchResult;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

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
     * Search for games by name on IGDB.
     *
     * @param query The game name to search for
     * @param limit Maximum number of results (default 10, max 20)
     * @return Search results with matching games
     */
    @GetMapping("/search")
    public ResponseEntity<GameSearchResult> searchGames(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Searching for games: '{}'", query);

        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(
                    new GameSearchResult("", java.util.List.of(), "igdb")
            );
        }

        GameSearchResult result = scraperService.searchGames(query.trim(), Math.min(limit, 20));
        log.info("Found {} results for '{}'", result.results().size(), query);

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
        log.info("Fetching game details for IGDB ID: {}", igdbId);

        Optional<ScrapedGameInfo> result = scraperService.getGameDetails(igdbId);

        return result.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Check if the scraper service is enabled and properly configured.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean enabled = scraperService.isEnabled();
        String provider = scraperService.getProviderName();
        return ResponseEntity.ok(Map.of(
                "enabled", enabled,
                "source", provider,
                "message", enabled
                        ? provider.toUpperCase() + " integration is configured and ready"
                        : provider.toUpperCase() + " integration is not configured. Set igdb.client-id and igdb.client-secret in application.properties"
        ));
    }
}
