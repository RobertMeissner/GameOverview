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
        // Check if game has Steam App ID
        SteamGameData steamData = game.getSteamData();
        if (steamData == null || steamData.appId() == null) {
            return EnrichmentResult.noChange(game, "No Steam App ID available");
        }

        int appId = steamData.appId();
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
            logger.info("Updating Steam name from '{}' to '{}'", steamData.name(), officialName);
        }
        builder.setSteamData(new SteamGameData(appId, officialName));

        // Update thumbnail if better quality available
        if (appData.headerImage() != null && !appData.headerImage().isBlank()) {
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
