package com.robertforpresent.api.scraper.domain.model;

import com.robertforpresent.api.shared.Parsing;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Optional;

/**
 * Represents game information scraped from external sources like IGDB.
 * This is a read-only value object containing scraped data.
 */
public record ScrapedGameInfo(
        long externalId,
        String name,
        @Nullable String slug,
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

    /**
     * Finds the first store link whose store name matches (case-insensitive),
     * e.g. {@code storeLink("Steam")}, {@code storeLink("GOG")}, {@code storeLink("Epic Games")}.
     */
    public Optional<StoreLink> storeLink(String storeName) {
        return storeLinks.stream()
                .filter(link -> link.storeName().equalsIgnoreCase(storeName))
                .findFirst();
    }

    public record StoreLink(
            String storeName,
            String url,
            @Nullable String storeId
    ) {
        /**
         * @return The store ID parsed as an integer, or empty if missing or not numeric
         */
        public Optional<Integer> storeIdAsInt() {
            return Optional.ofNullable(Parsing.parseIntOrNull(storeId));
        }
    }

    public record PlaytimeInfo(
            @Nullable Double mainStoryHours,
            @Nullable Double mainPlusExtrasHours,
            @Nullable Double completionistHours
    ) {}
}
