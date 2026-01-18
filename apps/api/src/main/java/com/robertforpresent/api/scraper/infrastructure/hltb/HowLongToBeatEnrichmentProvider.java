package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.HltbGameData;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import com.robertforpresent.api.scraper.infrastructure.hltb.dto.HltbSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Enriches canonical games with HowLongToBeat data (playtime estimates).
 * Searches HLTB by game name and retrieves main story, main+extra, and completionist times.
 */
@Component
public class HowLongToBeatEnrichmentProvider implements GameEnrichmentProvider {
    private static final Logger logger = LoggerFactory.getLogger(HowLongToBeatEnrichmentProvider.class);
    private static final String PROVIDER_NAME = "hltb";

    private final HltbApiClient apiClient;

    public HowLongToBeatEnrichmentProvider(HltbApiClient apiClient) {
        this.apiClient = apiClient;
    }

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        String gameName = game.getName();
        if (gameName == null || gameName.isBlank()) {
            return EnrichmentResult.noChange(game, "No game name available for HLTB search");
        }

        logger.debug("Searching HLTB for game: {}", gameName);

        // Search HLTB for the game
        Optional<HltbSearchResponse> searchResultOpt = apiClient.searchGame(gameName);
        if (searchResultOpt.isEmpty()) {
            return EnrichmentResult.failure(game, "Failed to search HLTB for: " + gameName);
        }

        HltbSearchResponse searchResult = searchResultOpt.get();
        if (searchResult.data() == null || searchResult.data().isEmpty()) {
            return EnrichmentResult.noChange(game, "No HLTB results found for: " + gameName);
        }

        // Find the best matching game
        Optional<HltbSearchResponse.HltbGame> bestMatchOpt = apiClient.findBestMatch(searchResult, gameName);
        if (bestMatchOpt.isEmpty()) {
            return EnrichmentResult.noChange(game, "No suitable HLTB match found for: " + gameName);
        }

        HltbSearchResponse.HltbGame hltbGame = bestMatchOpt.get();

        // Skip if no playtime data available
        if (hltbGame.compMain() <= 0 && hltbGame.compPlus() <= 0 && hltbGame.comp100() <= 0) {
            return EnrichmentResult.noChange(game, "HLTB has no playtime data for: " + hltbGame.gameName());
        }

        // Build HLTB data
        HltbGameData hltbData = new HltbGameData(
                hltbGame.gameId(),
                hltbGame.gameName(),
                hltbGame.mainStoryHours() > 0 ? hltbGame.mainStoryHours() : null,
                hltbGame.mainExtraHours() > 0 ? hltbGame.mainExtraHours() : null,
                hltbGame.completionistHours() > 0 ? hltbGame.completionistHours() : null
        );

        // Build enriched game preserving all existing data
        CanonicalGame enrichedGame = new CanonicalGame.Builder(game.getName())
                .setId(game.getId())
                .setThumbnailUrl(game.getThumbnailUrl())
                .setSteamRating(game.getRatings().steam())
                .setSteamData(game.getSteamData())
                .setGogData(game.getGogData())
                .setEpicData(game.getEpicData())
                .setMetacriticData(game.getMetacriticData())
                .setHltbData(hltbData)
                .setIgdbId(game.getIgdbId())
                .setIgdbSlug(game.getIgdbSlug())
                .setGenres(game.getGenres())
                .build();

        String timeInfo = String.format("Main: %.1fh", hltbGame.mainStoryHours());
        if (hltbGame.mainExtraHours() > 0) {
            timeInfo += String.format(", Extra: %.1fh", hltbGame.mainExtraHours());
        }

        return EnrichmentResult.success(
                enrichedGame,
                String.format("Enriched with HLTB data for '%s' (%s)", hltbGame.gameName(), timeInfo)
        );
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isEnabled() {
        return true; // HLTB API doesn't require authentication
    }
}
