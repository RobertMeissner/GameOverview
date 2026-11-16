package com.robertforpresent.api.scraper.infrastructure.steam;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamAppDetailsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Enriches canonical games with Steam data.
 * Uses existing Steam App ID if available, otherwise skips.
 */
@Component
public class SteamEnrichmentProvider implements GameEnrichmentProvider {
    private static final Logger logger = LoggerFactory.getLogger(SteamEnrichmentProvider.class);
    private static final String PROVIDER_NAME = "steam";

    private final SteamConfig config;
    private final SteamApiClient apiClient;

    public SteamEnrichmentProvider(SteamConfig config, SteamApiClient apiClient) {
        this.config = config;
        this.apiClient = apiClient;
    }

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // Check if game has Steam App ID, otherwise try to resolve it by name
        SteamGameData steamData = game.getSteamData();
        Integer existingAppId = steamData != null ? steamData.appId() : null;

        int appId;
        if (existingAppId != null) {
            appId = existingAppId;
        } else {
            Optional<Integer> resolvedAppId = apiClient.findAppIdByName(game.getName());
            if (resolvedAppId.isEmpty()) {
                return EnrichmentResult.noChange(game, "No Steam App ID available and no exact Steam match for '" + game.getName() + "'");
            }
            appId = resolvedAppId.get();
            logger.info("Resolved Steam App ID {} for game '{}' via store search", appId, game.getName());
        }

        logger.debug("Enriching game {} with Steam data for app ID {}", game.getName(), appId);

        // Fetch app details from Steam
        Optional<SteamAppDetailsResponse> detailsOpt = apiClient.getAppDetails(appId);
        if (detailsOpt.isEmpty()) {
            return EnrichmentResult.failure(game, "Failed to fetch Steam data for app ID " + appId);
        }

        SteamAppDetailsResponse.AppData appData = detailsOpt.get().data();
        if (appData == null) {
            return EnrichmentResult.failure(game, "No data returned for Steam app ID " + appId);
        }

        // Build enriched game
        CanonicalGame.Builder builder = new CanonicalGame.Builder(game.getName())
                .setId(game.getId());

        // Update Steam data with official name if different
        String officialName = appData.name();
        if (!game.getName().equals(officialName)) {
            String currentSteamName = steamData != null ? steamData.name() : null;
            logger.info("Updating Steam name from '{}' to '{}'", currentSteamName, officialName);
        }
        builder.setSteamData(new SteamGameData(appId, officialName));
        builder.setSteamRating(game.getRatings().steam());

        // Update thumbnail only if none is set yet; never override an existing (IGDB) cover
        if ((game.getThumbnailUrl() == null || game.getThumbnailUrl().isBlank())
                && appData.headerImage() != null && !appData.headerImage().isBlank()) {
            builder.setThumbnailUrl(appData.headerImage());
        } else if (game.getThumbnailUrl() != null) {
            builder.setThumbnailUrl(game.getThumbnailUrl());
        }

        // Add Metacritic score if available and not already set
        if (appData.metacritic() != null && game.getMetacriticData() == null) {
            // Note: We don't have MetacriticGameData constructor, so skip for now
            // This would need to be handled by MetacriticEnrichmentProvider
        }

        // Preserve existing data from other stores
        if (game.getGogData() != null) {
            builder.setGogData(game.getGogData());
        }
        if (game.getEpicData() != null) {
            builder.setEpicData(game.getEpicData());
        }
        if (game.getMetacriticData() != null) {
            builder.setMetacriticData(game.getMetacriticData());
        }
        if (game.getHltbData() != null) {
            builder.setHltbData(game.getHltbData());
        }
        if (game.getIgdbId() != null) {
            builder.setIgdbId(game.getIgdbId());
        }
        if (game.getIgdbSlug() != null) {
            builder.setIgdbSlug(game.getIgdbSlug());
        }
        builder.setIgdbRating(game.getRatings().igdb());
        builder.setGenres(game.getGenres());

        // Build the enriched game
        CanonicalGame enrichedGame = builder.build();

        return EnrichmentResult.success(
                enrichedGame,
                String.format("Enriched with Steam data for '%s' (App ID: %d)", officialName, appId)
        );
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isEnabled() {
        // Steam app details API doesn't require API key, so always enable
        return true;
    }
}
