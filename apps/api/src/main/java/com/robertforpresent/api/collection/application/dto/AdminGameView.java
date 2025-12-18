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
        Integer steamAppId,
        String steamName
) {
}
