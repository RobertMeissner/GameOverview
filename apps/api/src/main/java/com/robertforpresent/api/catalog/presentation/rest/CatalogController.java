package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.command.UpdateCatalogCommand;
import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.MetacriticGameData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for catalog operations.
 * Thin controller - converts DTOs to commands and delegates to services.
 */
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

    /**
     * Get all duplicate canonical games (games with the same name).
     * Returns groups of games that have identical names but different IDs.
     */
    @GetMapping("/catalog/duplicates")
    public List<CatalogDuplicateGroup> getDuplicates() {
        Map<String, List<CanonicalGame>> duplicates = service.findDuplicatesByName();
        return duplicates.entrySet().stream()
                .map(entry -> new CatalogDuplicateGroup(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(this::toGameEntry)
                                .toList()
                ))
                .sorted((a, b) -> Integer.compare(b.games().size(), a.games().size()))
                .toList();
    }

    private CatalogDuplicateGroup.CatalogGameEntry toGameEntry(CanonicalGame game) {
        SteamGameData steam = game.getSteamData();
        GogGameData gog = game.getGogData();
        MetacriticGameData mc = game.getMetacriticData();
        return new CatalogDuplicateGroup.CatalogGameEntry(
                game.getId(),
                game.getName(),
                game.getThumbnailUrl(),
                game.getRating(),
                steam != null ? steam.appId() : null,
                steam != null ? steam.name() : null,
                gog != null ? gog.gogId() : null,
                gog != null ? gog.name() : null,
                game.getIgdbId(),
                mc != null ? mc.score() : null
        );
    }

    @PatchMapping("/catalog/games/{gameId}")
    public CanonicalGame updateCatalogValues(@PathVariable UUID gameId, @RequestBody UpdateCatalogRequest request) {
        UpdateCatalogCommand command = new UpdateCatalogCommand(
                request.steamAppId(),
                request.steamName(),
                request.gogId(),
                request.gogName(),
                request.gogLink(),
                request.epicId(),
                request.epicName(),
                request.epicLink(),
                request.metacriticScore(),
                request.metacriticName(),
                request.metacriticLink()
        );
        return service.updateCatalogValues(gameId, command);
    }

    @PostMapping("/catalog/games/{targetId}/merge")
    public void mergeGames(@PathVariable UUID targetId, @RequestBody MergeGamesRequest request) {
        List<UUID> sourceIds = request.sourceIds().stream().map(UUID::fromString).toList();
        service.mergeGames(targetId, sourceIds);
    }

    /**
     * Automatically merge all duplicate canonical games.
     * Keeps the most complete version of each game and merges others into it.
     * @return Summary of the merge operation
     */
    @PostMapping("/catalog/auto-merge-duplicates")
    public AutoMergeResult autoMergeDuplicates() {
        log.info("Starting auto-merge of all duplicate canonical games");
        int mergedCount = service.autoMergeAllDuplicates();
        return new AutoMergeResult(mergedCount, "Successfully merged " + mergedCount + " duplicate games");
    }

    public record AutoMergeResult(int mergedCount, String message) {}

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
        log.debug("Rescrape request for game {}: {}", gameId, request);

        RescrapeRequest effectiveRequest = request != null ? request : new RescrapeRequest(null);
        RescrapeResult result = service.rescrapeGame(gameId, effectiveRequest);

        if (result.success()) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.ok(result); // Still return 200 with failure details
        }
    }
}
