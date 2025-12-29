package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.GameEnrichmentService;
import com.robertforpresent.api.catalog.application.service.GameEnrichmentService.EnrichmentBatchResult;
import com.robertforpresent.api.catalog.application.service.GameEnrichmentService.GameEnrichmentResult;
import com.robertforpresent.api.catalog.application.service.GameEnrichmentService.ProviderInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for enriching games with data from external sources.
 */
@RestController
@RequestMapping("/enrichment")
@CrossOrigin(origins = "http://localhost:4200")
public class GameEnrichmentController {
    private static final Logger logger = LoggerFactory.getLogger(GameEnrichmentController.class);

    private final GameEnrichmentService enrichmentService;

    public GameEnrichmentController(GameEnrichmentService enrichmentService) {
        this.enrichmentService = enrichmentService;
    }

    /**
     * Enrich all games in the catalog with data from all enabled providers.
     * This cycles through all games and attempts to enrich them with Steam,
     * Metacritic, HLTB, and other configured data sources.
     *
     * @return Result of the enrichment operation
     */
    @PostMapping("/enrich-all")
    public ResponseEntity<EnrichmentBatchResult> enrichAllGames() {
        logger.info("Received request to enrich all games");

        try {
            EnrichmentBatchResult result = enrichmentService.enrichAllGames();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to enrich games", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Enrich a single game with data from all enabled providers.
     *
     * @param gameId The game ID to enrich
     * @return Result of the enrichment operation
     */
    @PostMapping("/enrich/{gameId}")
    public ResponseEntity<GameEnrichmentResult> enrichGame(@PathVariable UUID gameId) {
        logger.info("Received request to enrich game: {}", gameId);

        try {
            GameEnrichmentResult result = enrichmentService.enrichGame(gameId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.error("Game not found: {}", gameId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to enrich game: {}", gameId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get list of all available enrichment providers and their status.
     *
     * @return List of provider information
     */
    @GetMapping("/providers")
    public ResponseEntity<List<ProviderInfo>> getProviders() {
        List<ProviderInfo> providers = enrichmentService.getAvailableProviders();
        return ResponseEntity.ok(providers);
    }
}
