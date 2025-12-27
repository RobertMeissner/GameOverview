package com.robertforpresent.api.catalog.presentation.rest;

import org.jspecify.annotations.Nullable;

/**
 * Request for rescraping game data from external sources (e.g., IGDB).
 *
 * @param igdbId Optional IGDB ID to fetch data directly. If null, uses the game's name to search.
 */
public record RescrapeRequest(
        @Nullable Long igdbId
) {
}
