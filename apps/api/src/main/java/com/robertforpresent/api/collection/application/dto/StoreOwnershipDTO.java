package com.robertforpresent.api.collection.application.dto;

public record StoreOwnershipDTO(
        boolean ownedOnSteam,
        boolean ownedOnGog,
        boolean ownedOnEpic,
        boolean ownedOnXbox,
        boolean ownedOnPlayStation,
        String otherStores
) {
}
