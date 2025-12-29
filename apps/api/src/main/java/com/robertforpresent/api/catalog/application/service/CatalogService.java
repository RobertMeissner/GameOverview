package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.application.command.UpdateCatalogCommand;
import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.port.GameCollectionPort;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.presentation.rest.RescrapeRequest;
import com.robertforpresent.api.catalog.presentation.rest.RescrapeResult;
import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.thumbnail.application.service.ThumbnailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application service for catalog operations.
 * Contains business logic for managing the game catalog.
 */
@Service
@Slf4j
public class CatalogService {
    private final CanonicalGameRepository repository;
    private final GameCollectionPort collectionPort;
    private final GameScraperService scraperService;
    private final ThumbnailService thumbnailService;

    public CatalogService(
            CanonicalGameRepository repository,
            GameCollectionPort collectionPort,
            GameScraperService scraperService,
            ThumbnailService thumbnailService) {
        this.repository = repository;
        this.collectionPort = collectionPort;
        this.scraperService = scraperService;
        this.thumbnailService = thumbnailService;
    }

    public CanonicalGame get(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public List<CanonicalGame> getAllGames() {
        return repository.findAll();
    }

    /**
     * Get multiple games by their IDs in a single query (batch loading).
     * Returns a map for efficient lookup.
     */
    public Map<UUID, CanonicalGame> getByIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.findAllByIds(ids).stream()
                .collect(Collectors.toMap(CanonicalGame::getId, game -> game));
    }

    public Optional<CanonicalGame> findByName(String name) {
        return repository.findByNameIgnoreCase(name);
    }

    public CanonicalGame save(CanonicalGame game) {
        return repository.save(game);
    }

    /**
     * Update catalog values for a game.
     *
     * @param id      The game ID
     * @param command The update command with new values
     * @return The updated game
     */
    public CanonicalGame updateCatalogValues(UUID id, UpdateCatalogCommand command) {
        CanonicalGame existing = repository.findById(id).orElseThrow();

        // Build updated Steam data
        SteamGameData existingSteam = existing.getSteamData();
        SteamGameData newSteamData = new SteamGameData(
                command.steamAppId() != null ? command.steamAppId() : (existingSteam != null ? existingSteam.appId() : null),
                command.steamName() != null ? command.steamName() : (existingSteam != null ? existingSteam.name() : null)
        );

        // Build updated GoG data
        GogGameData existingGog = existing.getGogData();
        GogGameData newGogData = new GogGameData(
                command.gogId() != null ? command.gogId() : (existingGog != null ? existingGog.gogId() : null),
                command.gogName() != null ? command.gogName() : (existingGog != null ? existingGog.name() : null),
                command.gogLink() != null ? command.gogLink() : (existingGog != null ? existingGog.link() : null)
        );

        // Build updated Epic Games data
        EpicGameData existingEpic = existing.getEpicData();
        EpicGameData newEpicData = new EpicGameData(
                command.epicId() != null ? command.epicId() : (existingEpic != null ? existingEpic.epicId() : null),
                command.epicName() != null ? command.epicName() : (existingEpic != null ? existingEpic.name() : null),
                command.epicLink() != null ? command.epicLink() : (existingEpic != null ? existingEpic.link() : null)
        );

        // Build updated Metacritic data
        MetacriticGameData existingMc = existing.getMetacriticData();
        MetacriticGameData newMetacriticData = new MetacriticGameData(
                command.metacriticScore() != null ? command.metacriticScore() : (existingMc != null ? existingMc.score() : null),
                command.metacriticName() != null ? command.metacriticName() : (existingMc != null ? existingMc.gameName() : null),
                command.metacriticLink() != null ? command.metacriticLink() : (existingMc != null ? existingMc.link() : null)
        );

        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(existing.getThumbnailUrl())
                .setSteamData(newSteamData)
                .setGogData(newGogData)
                .setEpicData(newEpicData)
                .setMetacriticData(newMetacriticData)
                .setIgdbId(existing.getIgdbId())
                .setIgdbSlug(existing.getIgdbSlug())
                .build();
        return repository.save(updated);
    }

    @Transactional
    public void mergeGames(UUID targetId, List<UUID> sourceIds) {
        log.info("Merging games: target={}, sources={}", targetId, sourceIds);

        // Verify target exists
        CanonicalGame target = repository.findById(targetId).orElseThrow();
        log.debug("Target game found: {}", target.getName());

        for (UUID sourceId : sourceIds) {
            // Verify source exists
            CanonicalGame source = repository.findById(sourceId).orElseThrow();
            log.debug("Merging source game '{}' ({}) into target '{}'", source.getName(), sourceId, target.getName());

            // Update all personalized game references to point to target
            collectionPort.updateCanonicalGameReferences(sourceId, targetId);
            log.debug("Updated personalized game references from {} to {}", sourceId, targetId);

            // Delete the source canonical game
            repository.deleteById(sourceId);
            log.info("Deleted source game: {} ({})", source.getName(), sourceId);
        }

        log.info("Merge completed successfully: {} source games merged into {}", sourceIds.size(), targetId);
    }

    /**
     * Find all canonical games that have duplicate names.
     * Returns a map of name -> list of games with that name (only entries with 2+ games).
     */
    public Map<String, List<CanonicalGame>> findDuplicatesByName() {
        return repository.findAll().stream()
                .collect(Collectors.groupingBy(
                        game -> game.getName().toLowerCase().trim(),
                        Collectors.toList()
                ))
                .entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
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
        log.debug("Rescraping game {} with request: {}", gameId, request);

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
            log.debug("No scraped data found for game {}", gameName);
            return RescrapeResult.failure(gameId.toString(), gameName, "No matching game found in IGDB");
        }

        ScrapedGameInfo info = scrapedData.get();
        log.debug("Found IGDB data for {}: coverUrl={}, storeLinks={}", gameName, info.coverUrl(), info.storeLinks());

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

        EpicGameData existingEpic = existing.getEpicData();
        EpicGameData newEpicData = new EpicGameData(
                existingEpic != null ? existingEpic.epicId() : null,
                existingEpic != null ? existingEpic.name() : null,
                epicLink != null ? epicLink : (existingEpic != null ? existingEpic.link() : null)
        );

        String newThumbnailUrl = info.coverUrl() != null ? info.coverUrl() : existing.getThumbnailUrl();

        // Store IGDB ID and slug from scraped data
        Long igdbId = info.externalId();
        String igdbSlug = info.slug();

        CanonicalGame updated = new CanonicalGame.Builder(existing.getName())
                .setId(existing.getId())
                .setSteamRating(existing.getRatings().steam())
                .setThumbnailUrl(newThumbnailUrl)
                .setSteamData(newSteamData)
                .setGogData(newGogData)
                .setEpicData(newEpicData)
                .setMetacriticData(existing.getMetacriticData())
                .setIgdbId(igdbId)
                .setIgdbSlug(igdbSlug)
                .build();

        repository.save(updated);

        // Evict cached thumbnail so it will be re-downloaded with new URL
        if (info.coverUrl() != null && !info.coverUrl().equals(existing.getThumbnailUrl())) {
            thumbnailService.evict(gameId);
            log.debug("Evicted cached thumbnail for game {} to download new image", gameName);
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

        log.debug("Successfully rescraped game {}", gameName);
        return RescrapeResult.success(gameId.toString(), gameName, fields);
    }
}
