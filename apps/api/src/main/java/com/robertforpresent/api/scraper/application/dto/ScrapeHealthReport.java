package com.robertforpresent.api.scraper.application.dto;

import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

/**
 * Result of a scrape health check ({@code GET /scraper/health}) over the configured reference games.
 */
public record ScrapeHealthReport(
        Instant checkedAt,
        List<ProviderStatus> providers,
        List<ReferenceGameCheck> referenceGames,
        int okCount,
        int failedCount
) {
    public boolean overallOk() {
        return failedCount == 0;
    }

    /**
     * Configuration status of one external source (search provider or enrichment provider).
     */
    public record ProviderStatus(String name, boolean enabled) {}

    /**
     * Health check for one reference game: catalog search, per-provider enrichment, thumbnail fetch.
     */
    public record ReferenceGameCheck(
            String query,
            boolean found,
            @Nullable Long externalId,
            @Nullable String matchedName,
            @Nullable Double rating,
            boolean inCatalog,
            List<ProviderCheck> providerChecks,
            @Nullable ThumbnailCheck thumbnail,
            boolean ok
    ) {}

    /**
     * Result of running one enrichment provider against a reference game.
     */
    public record ProviderCheck(String provider, boolean ok, boolean enriched, String message) {}

    /**
     * Result of fetching the reference game's cover/thumbnail URL.
     */
    public record ThumbnailCheck(boolean attempted, int httpStatus, boolean ok) {}
}
