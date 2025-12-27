package com.robertforpresent.api.scraper.domain.model;

import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * Represents game information scraped from external sources like IGDB.
 * This is a read-only value object containing scraped data.
 */
public record ScrapedGameInfo(
        long externalId,
        String name,
        @Nullable String summary,
        @Nullable String coverUrl,
        @Nullable Double rating,
        @Nullable Integer releaseYear,
        List<String> genres,
        List<String> platforms,
        List<StoreLink> storeLinks,
        @Nullable PlaytimeInfo playtime,
        String source
) {
    public ScrapedGameInfo {
        genres = genres != null ? List.copyOf(genres) : List.of();
        platforms = platforms != null ? List.copyOf(platforms) : List.of();
        storeLinks = storeLinks != null ? List.copyOf(storeLinks) : List.of();
    }

    public record StoreLink(
            String storeName,
            String url,
            @Nullable String storeId
    ) {}

    public record PlaytimeInfo(
            @Nullable Double mainStoryHours,
            @Nullable Double mainPlusExtrasHours,
            @Nullable Double completionistHours
    ) {}
}
