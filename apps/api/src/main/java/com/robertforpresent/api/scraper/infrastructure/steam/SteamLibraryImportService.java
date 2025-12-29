package com.robertforpresent.api.scraper.infrastructure.steam;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamAppDetailsResponse;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamOwnedGamesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service for importing Steam library with playtime information.
 */
@Service
public class SteamLibraryImportService {
    private static final Logger logger = LoggerFactory.getLogger(SteamLibraryImportService.class);

    private final SteamApiClient steamApiClient;
    private final CanonicalGameRepository canonicalGameRepository;
    private final CollectionRepository collectionRepository;

    public SteamLibraryImportService(
            SteamApiClient steamApiClient,
            CanonicalGameRepository canonicalGameRepository,
            CollectionRepository collectionRepository) {
        this.steamApiClient = steamApiClient;
        this.canonicalGameRepository = canonicalGameRepository;
        this.collectionRepository = collectionRepository;
    }

    /**
     * Import all games from a user's Steam library including playtime data.
     *
     * @param steamId The Steam ID (64-bit) of the user
     * @param gamerId The internal gamer ID to associate games with
     * @return Result of the import operation
     */
    @Transactional
    public SteamLibraryImportResult importSteamLibrary(String steamId, UUID gamerId) {
        logger.info("Starting Steam library import for Steam ID: {}, Gamer ID: {}", steamId, gamerId);

        // Validate Steam ID first
        if (!steamApiClient.validateSteamId(steamId)) {
            logger.error("Invalid or inaccessible Steam ID: {}", steamId);
            return new SteamLibraryImportResult(0, 0, 0, "Invalid or private Steam profile");
        }

        // Fetch owned games
        Optional<SteamOwnedGamesResponse> ownedGamesOpt = steamApiClient.getOwnedGames(steamId);
        if (ownedGamesOpt.isEmpty()) {
            logger.error("Failed to fetch owned games for Steam ID: {}", steamId);
            return new SteamLibraryImportResult(0, 0, 0, "Failed to fetch Steam library");
        }

        SteamOwnedGamesResponse ownedGames = ownedGamesOpt.get();
        List<SteamOwnedGamesResponse.SteamGame> games = ownedGames.response().games();

        if (games == null || games.isEmpty()) {
            logger.info("No games found in Steam library for Steam ID: {}", steamId);
            return new SteamLibraryImportResult(0, 0, 0, "No games found in Steam library");
        }

        int created = 0;
        int updated = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        logger.info("Processing {} games from Steam library", games.size());

        for (SteamOwnedGamesResponse.SteamGame game : games) {
            try {
                boolean isNew = importGame(game, gamerId);
                if (isNew) {
                    created++;
                } else {
                    updated++;
                }
            } catch (Exception e) {
                failed++;
                logger.error("Failed to import game: {} ({})", game.name(), game.appId(), e);
                errors.add(game.name() + ": " + e.getMessage());
            }
        }

        String message = String.format("Imported %d games (created: %d, updated: %d, failed: %d)",
                created + updated, created, updated, failed);

        if (!errors.isEmpty() && errors.size() <= 10) {
            message += ". Errors: " + String.join("; ", errors);
        }

        logger.info("Steam library import completed: {}", message);
        return new SteamLibraryImportResult(created, updated, failed, message);
    }

    /**
     * Import a single game from Steam library.
     *
     * @param steamGame The Steam game data from owned games API
     * @param gamerId The gamer ID to associate the game with
     * @return true if game was newly created, false if updated
     */
    private boolean importGame(SteamOwnedGamesResponse.SteamGame steamGame, UUID gamerId) {
        int appId = steamGame.appId();
        String gameName = steamGame.name();
        int playtimeMinutes = steamGame.playtimeForever();

        logger.debug("Importing game: {} (App ID: {}, Playtime: {} minutes)", gameName, appId, playtimeMinutes);

        // Check if canonical game exists for this Steam app ID
        Optional<CanonicalGame> existingGameOpt = canonicalGameRepository.findBySteamAppId(appId);

        CanonicalGame canonicalGame;
        boolean isNewGame;

        if (existingGameOpt.isPresent()) {
            // Game already exists in catalog
            canonicalGame = existingGameOpt.get();
            isNewGame = false;
            logger.debug("Game already exists in catalog: {}", canonicalGame.getName());
        } else {
            // Create new canonical game
            // Try to fetch additional details from Steam Store API
            String thumbnailUrl = buildThumbnailUrl(appId);
            Optional<SteamAppDetailsResponse> detailsOpt = steamApiClient.getAppDetails(appId);

            if (detailsOpt.isPresent() && detailsOpt.get().data() != null) {
                SteamAppDetailsResponse.AppData details = detailsOpt.get().data();
                thumbnailUrl = details.headerImage();
                gameName = details.name(); // Use official name from store
            }

            canonicalGame = new CanonicalGame.Builder(gameName)
                    .setSteamData(new SteamGameData(appId, gameName))
                    .setThumbnailUrl(thumbnailUrl)
                    .build();

            canonicalGame = canonicalGameRepository.save(canonicalGame);
            isNewGame = true;
            logger.info("Created new canonical game: {} ({})", gameName, canonicalGame.getId());
        }

        // Create or update personalized game with playtime
        List<PersonalizedGame> existingPersonalizedGames = collectionRepository.findByGamerId(gamerId);
        CanonicalGame finalCanonicalGame = canonicalGame;
        Optional<PersonalizedGame> existingPersonalized = existingPersonalizedGames.stream()
                .filter(pg -> pg.getCanonicalGameId().equals(finalCanonicalGame.getId()))
                .findFirst();

        PersonalizedGame personalizedGame;
        if (existingPersonalized.isPresent()) {
            // Update existing personalized game with latest playtime
            personalizedGame = existingPersonalized.get();
            personalizedGame.setSteamPlaytimeMinutes(playtimeMinutes);
            logger.debug("Updating playtime for personalized game: {} minutes", playtimeMinutes);
        } else {
            // Create new personalized game
            personalizedGame = new PersonalizedGame.Builder()
                    .setCanonicalId(canonicalGame.getId())
                    .setGamerId(gamerId)
                    .setSteamPlaytimeMinutes(playtimeMinutes)
                    .setMarkAsPlayed(playtimeMinutes > 0) // Mark as played if has playtime
                    .build();
            logger.debug("Created new personalized game with playtime: {} minutes", playtimeMinutes);
        }

        collectionRepository.save(personalizedGame);

        return isNewGame;
    }

    /**
     * Build thumbnail URL for Steam game header image.
     * Uses Steam's CDN format for game capsule images.
     */
    private String buildThumbnailUrl(int appId) {
        return String.format("https://cdn.cloudflare.steamstatic.com/steam/apps/%d/header.jpg", appId);
    }

    /**
     * Result of Steam library import operation.
     */
    public record SteamLibraryImportResult(
            int created,
            int updated,
            int failed,
            String message
    ) {}
}
