package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.presentation.rest.RescrapeRequest;
import com.robertforpresent.api.catalog.presentation.rest.RescrapeResult;
import com.robertforpresent.api.catalog.presentation.rest.UpdateCatalogRequest;
import com.robertforpresent.api.collection.infrastructure.persistence.SpringDataCollectionRepository;
import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.thumbnail.application.service.ThumbnailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class CatalogService {
    private final CanonicalGameRepository repository;
    private final SpringDataCollectionRepository collectionRepository;
    private final GameScraperService scraperService;
    private final ThumbnailService thumbnailService;

    public CanonicalGame get(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public CatalogService(
            CanonicalGameRepository repository,
            SpringDataCollectionRepository collectionRepository,
            GameScraperService scraperService,
            ThumbnailService thumbnailService) {
        this.repository = repository;
        this.collectionRepository = collectionRepository;
        this.scraperService = scraperService;
        this.thumbnailService = thumbnailService;
    }

    public List<CanonicalGame> getAllGames() {
        return repository.findAll();
    }

    public CanonicalGame updateCatalogValues(UUID id, UpdateCatalogRequest request) {
        CanonicalGame existing = repository.findById(id).orElseThrow();

        // Build updated Steam data
        SteamGameData existingSteam = existing.getSteamData();
        SteamGameData newSteamData = new SteamGameData(
                request.steamAppId() != null ? request.steamAppId() : (existingSteam != null ? existingSteam.appId() : null),
                request.steamName() != null ? request.steamName() : (existingSteam != null ? existingSteam.name() : null)
        );

        // Build updated GoG data
        GogGameData existingGog = existing.getGogData();
        GogGameData newGogData = new GogGameData(
                request.gogId() != null ? request.gogId() : (existingGog != null ? existingGog.gogId() : null),
                request.gogName() != null ? request.gogName() : (existingGog != null ? existingGog.name() : null),
                request.gogLink() != null ? request.gogLink() : (existingGog != null ? existingGog.link() : null)
        );

        // Build updated Metacritic data
        MetacriticGameData existingMc = existing.getMetacriticData();
        MetacriticGameData newMetacriticData = new MetacriticGameData(
                request.metacriticScore() != null ? request.metacriticScore() : (existingMc != null ? existingMc.score() : null),
                request.metacriticName() != null ? request.metacriticName() : (existingMc != null ? existingMc.gameName() : null),
                request.metacriticLink() != null ? request.metacriticLink() : (existingMc != null ? existingMc.link() : null)
        );

        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(existing.getThumbnailUrl())
                .setSteamData(newSteamData)
                .setGogData(newGogData)
                .setMetacriticData(newMetacriticData)
                .build();
        return repository.save(updated);
    }

    @Transactional
    public void mergeGames(UUID targetId, List<UUID> sourceIds) {
        // Verify target exists
        CanonicalGame target = repository.findById(targetId).orElseThrow();

        for (UUID sourceId : sourceIds) {
            // Verify source exists
            repository.findById(sourceId).orElseThrow();

            // Update all personalized game references to point to target
            collectionRepository.updateCanonicalGameReferences(sourceId.toString(), targetId.toString());

            // Delete the source canonical game
            repository.deleteById(sourceId);
        }
    }

    /**
     * Rescrape game data from IGDB and update the catalog entry.
     *
     * @param gameId The ID of the game to rescrape
     * @param request The rescrape request containing optional IGDB ID
     * @return Result of the rescrape operation
     */
    @Transactional
    public RescrapeResult rescrapeGame(UUID gameId, RescrapeRequest request) {
        log.info("Rescraping game {} with request: {}", gameId, request);

        CanonicalGame existing = repository.findById(gameId).orElseThrow();
        String gameName = existing.getName();

        // Get scraped data from IGDB
        Optional<ScrapedGameInfo> scrapedData;
        if (request.igdbId() != null) {
            // Fetch by IGDB ID directly
            scrapedData = scraperService.getGameDetails(request.igdbId());
        } else {
            // Search by game name and take first result
            var searchResult = scraperService.searchGames(gameName, 1);
            scrapedData = searchResult.results().isEmpty()
                    ? Optional.empty()
                    : Optional.of(searchResult.results().get(0));
        }

        if (scrapedData.isEmpty()) {
            log.warn("No scraped data found for game {}", gameName);
            return RescrapeResult.failure(gameId.toString(), gameName, "No matching game found in IGDB");
        }

        ScrapedGameInfo info = scrapedData.get();
        log.info("Found IGDB data for {}: coverUrl={}, storeLinks={}", gameName, info.coverUrl(), info.storeLinks());

        // Extract store links from scraped data
        Integer steamAppId = null;
        String steamLink = null;
        String gogLink = null;
        String epicLink = null;

        for (ScrapedGameInfo.StoreLink link : info.storeLinks()) {
            switch (link.storeName()) {
                case "Steam" -> {
                    steamLink = link.url();
                    if (link.storeId() != null) {
                        try {
                            steamAppId = Integer.parseInt(link.storeId());
                        } catch (NumberFormatException e) {
                            log.debug("Could not parse Steam app ID: {}", link.storeId());
                        }
                    }
                }
                case "GOG" -> gogLink = link.url();
                case "Epic Games" -> epicLink = link.url();
            }
        }

        // Build updated game - preserve existing data if scraped data is null
        SteamGameData existingSteam = existing.getSteamData();
        SteamGameData newSteamData = new SteamGameData(
                steamAppId != null ? steamAppId : (existingSteam != null ? existingSteam.appId() : null),
                existingSteam != null ? existingSteam.name() : null
        );

        GogGameData existingGog = existing.getGogData();
        GogGameData newGogData = new GogGameData(
                existingGog != null ? existingGog.gogId() : null,
                existingGog != null ? existingGog.name() : null,
                gogLink != null ? gogLink : (existingGog != null ? existingGog.link() : null)
        );

        String newThumbnailUrl = info.coverUrl() != null ? info.coverUrl() : existing.getThumbnailUrl();

        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(newThumbnailUrl)
                .setSteamData(newSteamData)
                .setGogData(newGogData)
                .setMetacriticData(existing.getMetacriticData())
                .build();

        repository.save(updated);

        // Evict cached thumbnail so it will be re-downloaded with new URL
        if (info.coverUrl() != null && !info.coverUrl().equals(existing.getThumbnailUrl())) {
            thumbnailService.evict(gameId);
            log.info("Evicted cached thumbnail for game {} to download new image", gameName);
        }

        RescrapeResult.UpdatedFields fields = new RescrapeResult.UpdatedFields(
                info.coverUrl(),
                steamAppId,
                steamLink,
                gogLink,
                epicLink,
                info.rating(),
                info.genres()
        );

        log.info("Successfully rescraped game {}", gameName);
        return RescrapeResult.success(gameId.toString(), gameName, fields);
    }
}
