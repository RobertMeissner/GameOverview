package com.robertforpresent.api.collection.application.dto;

import java.util.UUID;

public record CollectionGameView(
        UUID id,
        String name,
        String thumbnailUrl,
        float rating,
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater
) {
}
