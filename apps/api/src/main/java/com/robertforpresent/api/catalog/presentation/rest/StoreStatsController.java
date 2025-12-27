package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.CatalogStatsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for store statistics and dashboard data.
 * Thin controller - delegates to CatalogStatsService.
 */
@Slf4j
@RestController
@RequestMapping("/stores")
@CrossOrigin(origins = "http://localhost:4200")
public class StoreStatsController {
    private final CatalogStatsService statsService;

    public StoreStatsController(CatalogStatsService statsService) {
        this.statsService = statsService;
    }

    /**
     * Get statistics about games per store.
     */
    @GetMapping("/stats")
    public StoreStatsResponse getStoreStats() {
        var stats = statsService.getStoreStats();
        return new StoreStatsResponse(
                stats.totalGames(),
                toResponse(stats.steam()),
                toResponse(stats.gog()),
                toResponse(stats.epic()),
                toResponse(stats.metacritic()),
                stats.gamesWithoutStore()
        );
    }

    private StoreCountResponse toResponse(CatalogStatsService.StoreCount count) {
        return new StoreCountResponse(count.name(), count.count(), count.storeUrl());
    }

    // Response DTOs
    public record StoreStatsResponse(
            int totalGames,
            StoreCountResponse steam,
            StoreCountResponse gog,
            StoreCountResponse epic,
            StoreCountResponse metacritic,
            int gamesWithoutStore
    ) {}

    public record StoreCountResponse(String name, int count, String storeUrl) {}
}
