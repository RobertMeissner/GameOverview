package com.robertforpresent.api.scraper.domain.model;

import java.util.List;

/**
 * Represents the result of a game search operation.
 */
public record GameSearchResult(
        String query,
        List<ScrapedGameInfo> results,
        String source
) {
    public GameSearchResult {
        results = results != null ? List.copyOf(results) : List.of();
    }
}
