package com.robertforpresent.api.catalog.application.command;

import org.jspecify.annotations.Nullable;

/**
 * Command for rescraping game data from external sources (e.g., IGDB).
 *
 * @param igdbId Optional IGDB ID to fetch data directly. If null, uses the game's name to search.
 */
public record RescrapeCommand(
        @Nullable Long igdbId
) {
}
