package com.robertforpresent.api.catalog.domain.port;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;

import java.util.Optional;

/**
 * Port for enriching canonical games with additional data from external sources.
 * Implementations can enrich games with data from Steam, Metacritic, HLTB, etc.
 */
public interface GameEnrichmentProvider extends ExternalSource {

    /**
     * Attempt to enrich a game with additional data from this provider.
     *
     * @param game The game to enrich
     * @return Enrichment result containing updated game if enrichment was successful
     */
    EnrichmentResult enrichGame(CanonicalGame game);

    /**
     * Result of an enrichment operation.
     */
    record EnrichmentResult(
            boolean enriched,
            CanonicalGame game,
            String message
    ) {
        public static EnrichmentResult success(CanonicalGame game, String message) {
            return new EnrichmentResult(true, game, message);
        }

        public static EnrichmentResult noChange(CanonicalGame game, String message) {
            return new EnrichmentResult(false, game, message);
        }

        public static EnrichmentResult failure(CanonicalGame game, String message) {
            return new EnrichmentResult(false, game, message);
        }
    }
}
