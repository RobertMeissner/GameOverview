package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for bulk importing games from stores.
 */
@Slf4j
@RestController
@RequestMapping("/import")
@CrossOrigin(origins = "http://localhost:4200")
public class GameImportController {
    private static final UUID DEFAULT_GAMER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final CatalogService catalogService;
    private final CollectionRepository collectionRepository;

    public GameImportController(CatalogService catalogService, CollectionRepository collectionRepository) {
        this.catalogService = catalogService;
        this.collectionRepository = collectionRepository;
    }

    /**
     * Import multiple games from a store in bulk.
     */
    @PostMapping("/bulk")
    public ResponseEntity<BulkImportResponse> bulkImport(@RequestBody List<GameImportRequest> games) {
        log.info("Starting bulk import of {} games", games.size());

        List<ImportResult> results = new ArrayList<>();
        int created = 0;
        int updated = 0;
        int failed = 0;

        for (GameImportRequest game : games) {
            try {
                ImportResult result = importGame(game);
                results.add(result);
                if (result.created()) {
                    created++;
                } else {
                    updated++;
                }
            } catch (Exception e) {
                log.error("Failed to import game: {}", game.name(), e);
                results.add(new ImportResult(game.name(), null, false, "Error: " + e.getMessage()));
                failed++;
            }
        }

        log.info("Bulk import completed: {} created, {} updated, {} failed", created, updated, failed);
        return ResponseEntity.ok(new BulkImportResponse(created, updated, failed, results));
    }

    /**
     * Import a single game from a store.
     */
    @PostMapping("/single")
    public ResponseEntity<ImportResult> importSingle(@RequestBody GameImportRequest request) {
        try {
            ImportResult result = importGame(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to import game: {}", request.name(), e);
            return ResponseEntity.badRequest()
                    .body(new ImportResult(request.name(), null, false, "Error: " + e.getMessage()));
        }
    }

    private ImportResult importGame(GameImportRequest request) {
        String normalizedName = request.name().trim();
        Optional<CanonicalGame> existing = catalogService.findByName(normalizedName);

        CanonicalGame.Builder builder;
        boolean isNew;
        UUID gameId;

        if (existing.isPresent()) {
            // Update existing game with store data
            CanonicalGame game = existing.get();
            builder = new CanonicalGame.Builder(game.getName())
                    .setId(game.getId())
                    .setSteamRating(game.getRatings().steam())
                    .setThumbnailUrl(game.getThumbnailUrl() != null ? game.getThumbnailUrl() : request.thumbnailUrl())
                    .setSteamData(game.getSteamData())
                    .setGogData(game.getGogData())
                    .setEpicData(game.getEpicData())
                    .setMetacriticData(game.getMetacriticData());
            isNew = false;
            gameId = game.getId();
        } else {
            // Create new game
            builder = new CanonicalGame.Builder(normalizedName)
                    .setThumbnailUrl(request.thumbnailUrl());
            isNew = true;
            gameId = null;
        }

        // Apply store-specific data
        applyStoreData(builder, request);

        CanonicalGame savedGame = catalogService.save(builder.build());

        // Ensure game is in user's collection
        if (isNew) {
            ensureInCollection(savedGame.getId());
        }

        return new ImportResult(
                normalizedName,
                savedGame.getId().toString(),
                isNew,
                isNew ? "Created new game" : "Updated existing game with " + request.store() + " data"
        );
    }

    private void applyStoreData(CanonicalGame.Builder builder, GameImportRequest request) {
        String store = request.store().toLowerCase();
        switch (store) {
            case "steam" -> {
                Integer appId = null;
                if (request.storeId() != null) {
                    try {
                        appId = Integer.parseInt(request.storeId());
                    } catch (NumberFormatException ignored) {
                    }
                }
                builder.setSteamData(new SteamGameData(appId, request.name()));
            }
            case "gog" -> {
                Long gogId = null;
                if (request.storeId() != null) {
                    try {
                        gogId = Long.parseLong(request.storeId());
                    } catch (NumberFormatException ignored) {
                    }
                }
                builder.setGogData(new GogGameData(gogId, request.name(), request.storeLink()));
            }
            case "epic" -> builder.setEpicData(new EpicGameData(request.storeId(), request.name(), request.storeLink()));
            default -> log.warn("Unknown store: {}", store);
        }
    }

    private void ensureInCollection(UUID gameId) {
        // Check if already in collection
        List<PersonalizedGame> existing = collectionRepository.findByGamerId(DEFAULT_GAMER_ID);
        boolean alreadyInCollection = existing.stream()
                .anyMatch(pg -> pg.getCanonicalGameId().equals(gameId));

        if (!alreadyInCollection) {
            PersonalizedGame pg = new PersonalizedGame.Builder()
                    .setCanonicalId(gameId)
                    .setGamerId(DEFAULT_GAMER_ID)
                    .build();
            collectionRepository.save(pg);
        }
    }

    public record ImportResult(
            String name,
            String gameId,
            boolean created,
            String message
    ) {}

    public record BulkImportResponse(
            int created,
            int updated,
            int failed,
            List<ImportResult> results
    ) {}
}
