package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.CatalogStatsService;
import com.robertforpresent.api.catalog.application.service.StoreService;
import com.robertforpresent.api.catalog.domain.model.Store;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for store statistics and dashboard data.
 * Thin controller - delegates to CatalogStatsService and StoreService.
 */
@Slf4j
@RestController
@RequestMapping("/stores")
@CrossOrigin(origins = "http://localhost:4200")
public class StoreStatsController {
    private final CatalogStatsService statsService;
    private final StoreService storeService;

    public StoreStatsController(CatalogStatsService statsService, StoreService storeService) {
        this.statsService = statsService;
        this.storeService = storeService;
    }

    /**
     * Get all active stores.
     */
    @GetMapping
    public List<StoreResponse> getStores() {
        return storeService.getActiveStores().stream()
            .map(this::toResponse)
            .toList();
    }

    private StoreResponse toResponse(Store store) {
        return new StoreResponse(
            store.id().toString(),
            store.code(),
            store.name(),
            store.url(),
            store.iconUrl()
        );
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
    public record StoreResponse(String id, String code, String name, String url, String iconUrl) {}

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
