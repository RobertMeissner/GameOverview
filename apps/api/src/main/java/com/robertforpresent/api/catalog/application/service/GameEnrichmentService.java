package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for enriching games with data from external sources.
 * Cycles through all games and attempts to enrich them with data from configured providers.
 */
@Service
public class GameEnrichmentService {
    private static final Logger logger = LoggerFactory.getLogger(GameEnrichmentService.class);

    private final CanonicalGameRepository gameRepository;
    private final List<GameEnrichmentProvider> enrichmentProviders;

    public GameEnrichmentService(
            CanonicalGameRepository gameRepository,
            List<GameEnrichmentProvider> enrichmentProviders) {
        this.gameRepository = gameRepository;
        this.enrichmentProviders = enrichmentProviders;
        logger.info("Initialized GameEnrichmentService with {} providers: {}",
                enrichmentProviders.size(),
                enrichmentProviders.stream().map(GameEnrichmentProvider::getProviderName).toList());
    }

    /**
     * Enrich all games in the catalog with data from all enabled providers.
     *
     * @return Result of the enrichment operation
     */
    public EnrichmentBatchResult enrichAllGames() {
        logger.info("Starting enrichment for all games");

        List<CanonicalGame> allGames = gameRepository.findAll();
        logger.info("Found {} games to enrich", allGames.size());

        int totalEnriched = 0;
        int totalUnchanged = 0;
        int totalFailed = 0;
        List<GameEnrichmentDetail> details = new ArrayList<>();

        for (CanonicalGame game : allGames) {
            GameEnrichmentResult result = enrichGame(game.getId());
            details.add(new GameEnrichmentDetail(
                    game.getId(),
                    game.getName(),
                    result.enriched(),
                    result.providersUsed(),
                    result.message()
            ));

            if (result.enriched()) {
                totalEnriched++;
            } else if (result.failed()) {
                totalFailed++;
            } else {
                totalUnchanged++;
            }
        }

        String message = String.format("Enrichment complete: %d enriched, %d unchanged, %d failed",
                totalEnriched, totalUnchanged, totalFailed);
        logger.info(message);

        return new EnrichmentBatchResult(
                totalEnriched,
                totalUnchanged,
                totalFailed,
                details,
                message
        );
    }

    /**
     * Enrich a single game with data from all enabled providers.
     *
     * @param gameId The game ID to enrich
     * @return Result of the enrichment operation
     */
    public GameEnrichmentResult enrichGame(UUID gameId) {
        CanonicalGame game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        logger.debug("Enriching game: {} ({})", game.getName(), gameId);

        boolean wasEnriched = false;
        boolean hadFailure = false;
        List<String> providersUsed = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        CanonicalGame currentGame = game;

        // Try each enabled provider
        for (GameEnrichmentProvider provider : enrichmentProviders) {
            if (!provider.isEnabled()) {
                logger.debug("Provider {} is disabled, skipping", provider.getProviderName());
                continue;
            }

            try {
                logger.debug("Attempting enrichment with provider: {}", provider.getProviderName());
                GameEnrichmentProvider.EnrichmentResult result = provider.enrichGame(currentGame);

                if (result.enriched()) {
                    currentGame = result.game();
                    wasEnriched = true;
                    providersUsed.add(provider.getProviderName());
                    messages.add(result.message());
                    logger.debug("Successfully enriched with {}: {}", provider.getProviderName(), result.message());
                } else {
                    logger.debug("No enrichment from {}: {}", provider.getProviderName(), result.message());
                }
            } catch (Exception e) {
                hadFailure = true;
                String errorMsg = String.format("Error from provider %s: %s", provider.getProviderName(), e.getMessage());
                messages.add(errorMsg);
                logger.error(errorMsg, e);
            }
        }

        // Save if any changes were made
        if (wasEnriched) {
            currentGame = gameRepository.save(currentGame);
            logger.info("Enriched and saved game: {} with providers: {}", game.getName(), providersUsed);
        }

        String finalMessage = messages.isEmpty()
                ? "No enrichment needed"
                : String.join("; ", messages);

        return new GameEnrichmentResult(
                wasEnriched,
                hadFailure,
                providersUsed,
                finalMessage
        );
    }

    /**
     * Get list of all available enrichment providers.
     *
     * @return List of provider information
     */
    public List<ProviderInfo> getAvailableProviders() {
        return enrichmentProviders.stream()
                .map(p -> new ProviderInfo(p.getProviderName(), p.isEnabled()))
                .toList();
    }

    // Result DTOs
    public record GameEnrichmentResult(
            boolean enriched,
            boolean failed,
            List<String> providersUsed,
            String message
    ) {}

    public record EnrichmentBatchResult(
            int enriched,
            int unchanged,
            int failed,
            List<GameEnrichmentDetail> details,
            String message
    ) {}

    public record GameEnrichmentDetail(
            UUID gameId,
            String gameName,
            boolean enriched,
            List<String> providersUsed,
            String message
    ) {}

    public record ProviderInfo(
            String name,
            boolean enabled
    ) {}
}
