package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class CatalogController {
    private final CatalogService service;

    public CatalogController(CatalogService service) {
        this.service = service;
    }

    @GetMapping("/catalog")
    public List<CanonicalGame> games() {
        return service.getAllGames();
    }

    @PatchMapping("/catalog/games/{gameId}")
    public CanonicalGame updateCatalogValues(@PathVariable UUID gameId, @RequestBody UpdateCatalogRequest request) {
        return service.updateCatalogValues(gameId, request);
    }

    @PostMapping("/catalog/games/{targetId}/merge")
    public void mergeGames(@PathVariable UUID targetId, @RequestBody MergeGamesRequest request) {
        List<UUID> sourceIds = request.sourceIds().stream().map(UUID::fromString).toList();
        service.mergeGames(targetId, sourceIds);
    }

    /**
     * Rescrape game data from external sources (IGDB) and update the catalog entry.
     *
     * @param gameId The ID of the game to rescrape
     * @param request Optional request body with IGDB ID. If not provided, searches by game name.
     * @return Result of the rescrape operation
     */
    @PostMapping("/catalog/games/{gameId}/rescrape")
    public ResponseEntity<RescrapeResult> rescrapeGame(
            @PathVariable UUID gameId,
            @RequestBody(required = false) RescrapeRequest request) {
        log.info("Rescrape request for game {}: {}", gameId, request);

        RescrapeRequest effectiveRequest = request != null ? request : new RescrapeRequest(null);
        RescrapeResult result = service.rescrapeGame(gameId, effectiveRequest);

        if (result.success()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.ok(result); // Still return 200 with failure details
        }
    }
}
