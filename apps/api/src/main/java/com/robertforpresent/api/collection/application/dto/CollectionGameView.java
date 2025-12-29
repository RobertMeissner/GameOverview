package com.robertforpresent.api.collection.application.dto;

import java.util.UUID;

public record CollectionGameView(
        UUID id,
        String name,
        String thumbnailUrl,
        float rating,
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater,
        StoreLinksDTO storeLinks,
        Integer steamPlaytimeMinutes,
        StoreOwnershipDTO storeOwnership
) {
}

public record StoreOwnershipDTO(
        boolean ownedOnSteam,
        boolean ownedOnGog,
        boolean ownedOnEpic,
        boolean ownedOnXbox,
        boolean ownedOnPlayStation,
        String otherStores
) {
}
