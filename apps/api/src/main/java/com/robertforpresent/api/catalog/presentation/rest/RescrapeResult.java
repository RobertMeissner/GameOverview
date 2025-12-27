package com.robertforpresent.api.catalog.presentation.rest;

import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Result of a game rescrape operation.
 */
public record RescrapeResult(
        boolean success,
        String gameId,
        String gameName,
        @Nullable String message,
        @Nullable UpdatedFields updatedFields
) {
    public record UpdatedFields(
            @Nullable String thumbnailUrl,
            @Nullable Integer steamAppId,
            @Nullable String steamLink,
            @Nullable String gogLink,
            @Nullable String epicLink,
            @Nullable Double rating,
            List<String> genres
    ) {}

    public static RescrapeResult success(String gameId, String gameName, UpdatedFields fields) {
        return new RescrapeResult(true, gameId, gameName, "Game data updated successfully", fields);
    }

    public static RescrapeResult failure(String gameId, String gameName, String message) {
        return new RescrapeResult(false, gameId, gameName, message, null);
    }
}
