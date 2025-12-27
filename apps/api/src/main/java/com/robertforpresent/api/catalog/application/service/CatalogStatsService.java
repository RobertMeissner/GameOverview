package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Application service for catalog statistics.
 * Contains business logic for computing store statistics.
 */
@Service
public class CatalogStatsService {
    private final CanonicalGameRepository gameRepository;

    public CatalogStatsService(CanonicalGameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    /**
     * Get statistics about games per store.
     */
    public StoreStats getStoreStats() {
        List<CanonicalGame> allGames = gameRepository.findAll();

        int total = allGames.size();
        int steamCount = 0;
        int gogCount = 0;
        int epicCount = 0;
        int metacriticCount = 0;
        int noStoreCount = 0;

        for (CanonicalGame game : allGames) {
            boolean hasSteam = game.getSteamData() != null && game.getSteamData().appId() != null;
            boolean hasGog = game.getGogData() != null &&
                    (game.getGogData().gogId() != null || game.getGogData().link() != null);
            boolean hasEpic = game.getEpicData() != null &&
                    (game.getEpicData().epicId() != null || game.getEpicData().link() != null);
            boolean hasMetacritic = game.getMetacriticData() != null &&
                    game.getMetacriticData().score() != null;

            if (hasSteam) steamCount++;
            if (hasGog) gogCount++;
            if (hasEpic) epicCount++;
            if (hasMetacritic) metacriticCount++;

            if (!hasSteam && !hasGog && !hasEpic) {
                noStoreCount++;
            }
        }

        return new StoreStats(
                total,
                new StoreCount("Steam", steamCount, "https://store.steampowered.com"),
                new StoreCount("GOG", gogCount, "https://www.gog.com"),
                new StoreCount("Epic Games", epicCount, "https://store.epicgames.com"),
                new StoreCount("Metacritic", metacriticCount, "https://www.metacritic.com"),
                noStoreCount
        );
    }

    // Result records
    public record StoreStats(
            int totalGames,
            StoreCount steam,
            StoreCount gog,
            StoreCount epic,
            StoreCount metacritic,
            int gamesWithoutStore
    ) {}

    public record StoreCount(String name, int count, String storeUrl) {}
}
