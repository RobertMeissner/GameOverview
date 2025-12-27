package com.robertforpresent.api.catalog.application.command;

import org.jspecify.annotations.Nullable;

/**
 * Command for updating catalog values of a game.
 * Application layer command - decoupled from presentation layer.
 */
public record UpdateCatalogCommand(
        // Steam data
        @Nullable Integer steamAppId,
        @Nullable String steamName,
        // GoG data
        @Nullable Long gogId,
        @Nullable String gogName,
        @Nullable String gogLink,
        // Epic Games data
        @Nullable String epicId,
        @Nullable String epicName,
        @Nullable String epicLink,
        // Metacritic data
        @Nullable Integer metacriticScore,
        @Nullable String metacriticName,
        @Nullable String metacriticLink
) {
}
