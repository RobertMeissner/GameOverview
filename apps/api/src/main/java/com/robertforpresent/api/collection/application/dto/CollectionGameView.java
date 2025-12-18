package com.robertforpresent.api.collection.application.dto;

public record CollectionGameView(
        String id,
        String name,
        String thumbnailUrl,
        float rating,
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater
) {
}
