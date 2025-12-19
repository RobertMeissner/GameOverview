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
        // Metacritic data
        Integer metacriticScore,
        String metacriticName,
        String metacriticLink
) {
}
