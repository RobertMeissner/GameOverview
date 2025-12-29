package com.robertforpresent.api.collection.application.dto;

import java.util.UUID;

public record AdminGameView(
        UUID id,
        String name,
        String thumbnailUrl,
        float rating,
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater,
        // Steam data
        Integer steamAppId,
        String steamName,
        String steamLink,
        // GoG data
        Long gogId,
        String gogName,
        String gogLink,
        // IGDB data
        Long igdbId,
        String igdbLink,
        // Metacritic data
        Integer metacriticScore,
        String metacriticName,
        String metacriticLink,
        // Completeness metric (percentage of non-null important fields)
        int completenessPercent
) {
    private static final String IGDB_GAME_URL = "https://www.igdb.com/games/";

    public static String buildIgdbLink(Long igdbId, String gameName) {
        if (igdbId == null) return null;
        // IGDB uses slugified game names in URLs
        String slug = gameName != null ? gameName.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "") : String.valueOf(igdbId);
        return IGDB_GAME_URL + slug;
    }
}
