package com.robertforpresent.api.scraper.infrastructure.catalog;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Adapter for looking up games in the catalog.
 * Implements the CatalogLookup port using the CanonicalGameRepository.
 */
@Component
public class CatalogLookupAdapter implements CatalogLookup {

    private final CanonicalGameRepository gameRepository;

    public CatalogLookupAdapter(CanonicalGameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    public Optional<CatalogMatch> findMatch(ScrapedGameInfo gameInfo) {
        // First try to match by Steam App ID (most reliable)
        for (ScrapedGameInfo.StoreLink link : gameInfo.storeLinks()) {
            if ("Steam".equals(link.storeName()) && link.storeId() != null) {
                try {
                    Integer steamAppId = Integer.parseInt(link.storeId());
                    Optional<CatalogMatch> steamMatch = findBySteamAppId(steamAppId);
                    if (steamMatch.isPresent()) {
                        return steamMatch;
                    }
                } catch (NumberFormatException ignored) {
                    // Invalid Steam ID, continue to name matching
                }
            }
        }

        // Fall back to exact name matching
        return findByExactName(gameInfo.name());
    }

    @Override
    public Optional<CatalogMatch> findBySteamAppId(Integer steamAppId) {
        if (steamAppId == null) {
            return Optional.empty();
        }

        return gameRepository.findBySteamAppId(steamAppId)
                .map(game -> new CatalogMatch(game.getId(), "Steam App ID: " + steamAppId));
    }

    @Override
    public Optional<CatalogMatch> findByExactName(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }

        return gameRepository.findByNameContainingIgnoreCase(name).stream()
                .filter(game -> game.getName().equalsIgnoreCase(name))
                .findFirst()
                .map(game -> new CatalogMatch(game.getId(), "Name: " + name));
    }
}
