package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.application.command.ImportGameCommand;
import com.robertforpresent.api.catalog.domain.model.*;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.catalog.domain.port.GameCollectionPort;
import com.robertforpresent.api.shared.Parsing;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application service for importing games from external stores.
 * Follows hexagonal architecture - contains business logic, depends only on domain.
 */
@Slf4j
@Service
public class GameImportService {
    private final CanonicalGameRepository gameRepository;
    private final GameCollectionPort collectionPort;

    public GameImportService(CanonicalGameRepository gameRepository, GameCollectionPort collectionPort) {
        this.gameRepository = gameRepository;
        this.collectionPort = collectionPort;
    }

    /**
     * Import multiple games in bulk.
     */
    public BulkImportResult importGames(List<ImportGameCommand> commands, UUID gamerId) {
        log.info("Starting bulk import of {} games for gamer {}", commands.size(), gamerId);

        List<SingleImportResult> results = new ArrayList<>();
        int created = 0;
        int updated = 0;
        int failed = 0;

        for (ImportGameCommand command : commands) {
            try {
                SingleImportResult result = importSingleGame(command, gamerId);
                results.add(result);
                if (result.created()) {
                    created++;
                } else {
                    updated++;
                }
            } catch (Exception e) {
                log.error("Failed to import game: {}", command.name(), e);
                results.add(new SingleImportResult(command.name(), null, false, "Error: " + e.getMessage()));
                failed++;
            }
        }

        log.info("Bulk import completed: {} created, {} updated, {} failed", created, updated, failed);
        return new BulkImportResult(created, updated, failed, results);
    }

    /**
     * Import a single game.
     */
    public SingleImportResult importSingleGame(ImportGameCommand command, UUID gamerId) {
        String normalizedName = command.name().trim();
        Optional<CanonicalGame> existing = findByName(normalizedName);

        CanonicalGame.Builder builder;
        boolean isNew;

        if (existing.isPresent()) {
            CanonicalGame game = existing.get();
            builder = game.toBuilder()
                    .setThumbnailUrl(game.getThumbnailUrl() != null ? game.getThumbnailUrl() : command.thumbnailUrl());
            isNew = false;
        } else {
            builder = new CanonicalGame.Builder(normalizedName)
                    .setThumbnailUrl(command.thumbnailUrl());
            isNew = true;
        }

        applyStoreData(builder, command);

        CanonicalGame savedGame = gameRepository.save(builder.build());

        // Always update collection to set/update ownership flags
        collectionPort.addGameToCollection(gamerId, savedGame.getId(), command.store());

        return new SingleImportResult(
                normalizedName,
                savedGame.getId().toString(),
                isNew,
                isNew ? "Created new game" : "Updated existing game with " + command.store() + " data"
        );
    }

    private Optional<CanonicalGame> findByName(String name) {
        return gameRepository.findByNameIgnoreCase(name);
    }

    private void applyStoreData(CanonicalGame.Builder builder, ImportGameCommand command) {
        switch (StoreCode.fromCode(command.store())) {
            // "steam-family" is Steam Family Sharing - treated the same as steam
            case STEAM -> builder.setSteamData(new SteamGameData(Parsing.parseIntOrNull(command.storeId()), command.name()));
            case GOG -> builder.setGogData(new GogGameData(Parsing.parseLongOrNull(command.storeId()), command.name(), command.storeLink()));
            case EPIC -> builder.setEpicData(new EpicGameData(command.storeId(), command.name(), command.storeLink()));
            default -> log.warn("Unknown store: {}", command.store());
        }
    }

    // Result records
    public record SingleImportResult(String name, String gameId, boolean created, String message) {}
    public record BulkImportResult(int created, int updated, int failed, List<SingleImportResult> results) {}
}
