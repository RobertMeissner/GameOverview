package com.robertforpresent.api.scraper.domain.model;

import org.jspecify.annotations.Nullable;

import java.util.UUID;

/**
 * Enriched game info that includes library/catalog status.
 * Wraps ScrapedGameInfo with additional catalog matching information.
 */
public record EnrichedGameInfo(
        ScrapedGameInfo gameInfo,
        boolean inLibrary,
        @Nullable UUID catalogGameId,
        @Nullable String matchReason
) {
    public static EnrichedGameInfo notInLibrary(ScrapedGameInfo gameInfo) {
        return new EnrichedGameInfo(gameInfo, false, null, null);
    }

    public static EnrichedGameInfo inLibrary(ScrapedGameInfo gameInfo, UUID catalogGameId, String matchReason) {
        return new EnrichedGameInfo(gameInfo, true, catalogGameId, matchReason);
    }
}
