package com.robertforpresent.api.scraper.domain.model;

import java.util.List;

/**
 * Enriched search result that includes library status for each game.
 */
public record EnrichedSearchResult(
        String query,
        List<EnrichedGameInfo> results,
        String source
) {
    public EnrichedSearchResult {
        results = results != null ? List.copyOf(results) : List.of();
    }
}
