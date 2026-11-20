package com.robertforpresent.api.scraper.infrastructure.catalog;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import com.robertforpresent.api.scraper.domain.port.GameCatalogWriter;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Adapter for adding games to the catalog and user's collection.
 */
@Component
@Slf4j
public class GameCatalogWriterAdapter implements GameCatalogWriter {

    private final CanonicalGameRepository catalogRepository;
    private final CollectionRepository collectionRepository;
    private final CatalogLookup catalogLookup;

    public GameCatalogWriterAdapter(
            CanonicalGameRepository catalogRepository,
            CollectionRepository collectionRepository,
            CatalogLookup catalogLookup) {
        this.catalogRepository = catalogRepository;
        this.collectionRepository = collectionRepository;
        this.catalogLookup = catalogLookup;
    }

    @Override
    public AddGameResult addGameToLibrary(ScrapedGameInfo gameInfo, UUID gamerId) {
        // Check if game already exists in catalog
        var existingMatch = catalogLookup.findMatch(gameInfo);

        UUID canonicalGameId;
        boolean created;

        if (existingMatch.isPresent()) {
            canonicalGameId = existingMatch.get().gameId();
            created = false;
            log.debug("Found existing game in catalog: {} ({})", gameInfo.name(), canonicalGameId);
            catalogRepository.findById(canonicalGameId).ifPresent(existing ->
                    catalogRepository.save(mergeScrapedData(existing, gameInfo)));
        } else {
            // Create new canonical game
            CanonicalGame newGame = createCanonicalGame(gameInfo);
            CanonicalGame savedGame = catalogRepository.save(newGame);
            canonicalGameId = savedGame.getId();
            created = true;
            log.debug("Created new game in catalog: {} ({})", gameInfo.name(), canonicalGameId);
        }

        // Create personalized game entry for the user
        PersonalizedGame personalizedGame = new PersonalizedGame.Builder()
                .setCanonicalId(canonicalGameId)
                .setGamerId(gamerId)
                .setMarkAsPlayed(false)
                .setMarkAsHidden(false)
                .setMarkAsForLater(false)
                .build();

        PersonalizedGame savedPersonalized = collectionRepository.save(personalizedGame);
        log.debug("Added game to user's collection: {} -> user {}", gameInfo.name(), gamerId);

        return new AddGameResult(canonicalGameId, savedPersonalized.getCanonicalGameId(), created);
    }

    private CanonicalGame createCanonicalGame(ScrapedGameInfo gameInfo) {
        CanonicalGame.Builder builder = new CanonicalGame.Builder(gameInfo.name())
                .setThumbnailUrl(gameInfo.coverUrl())
                .setSteamData(extractSteamData(gameInfo))
                .setGogData(extractGogData(gameInfo))
                .setGenres(gameInfo.genres());

        if (isIgdbSource(gameInfo)) {
            builder.setIgdbId(gameInfo.externalId())
                    .setIgdbSlug(gameInfo.slug())
                    .setIgdbRating(gameInfo.rating());
        }

        return builder.build();
    }

    private CanonicalGame mergeScrapedData(CanonicalGame existing, ScrapedGameInfo gameInfo) {
        CanonicalGame.Builder builder = existing.toBuilder()
                .setThumbnailUrl(existing.getThumbnailUrl() != null ? existing.getThumbnailUrl() : gameInfo.coverUrl())
                .setSteamData(existing.getSteamData() != null ? existing.getSteamData() : extractSteamData(gameInfo))
                .setGogData(existing.getGogData() != null ? existing.getGogData() : extractGogData(gameInfo))
                .setGenres(!gameInfo.genres().isEmpty() ? gameInfo.genres() : existing.getGenres());

        if (isIgdbSource(gameInfo)) {
            builder.setIgdbId(gameInfo.externalId())
                    .setIgdbSlug(gameInfo.slug())
                    .setIgdbRating(gameInfo.rating() != null ? gameInfo.rating() : existing.getRatings().igdb());
        }

        return builder.build();
    }

    private boolean isIgdbSource(ScrapedGameInfo gameInfo) {
        return "igdb".equals(gameInfo.source());
    }

    @Nullable
    private SteamGameData extractSteamData(ScrapedGameInfo gameInfo) {
        return gameInfo.storeLink("Steam")
                .flatMap(ScrapedGameInfo.StoreLink::storeIdAsInt)
                .map(appId -> new SteamGameData(appId, gameInfo.name()))
                .orElse(null);
    }

    @Nullable
    private GogGameData extractGogData(ScrapedGameInfo gameInfo) {
        return gameInfo.storeLink("GOG")
                .map(link -> new GogGameData(null, gameInfo.name(), link.url()))
                .orElse(null);
    }
}
