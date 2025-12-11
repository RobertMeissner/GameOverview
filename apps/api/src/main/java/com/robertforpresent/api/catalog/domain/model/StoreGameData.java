package com.robertforpresent.api.catalog.domain.model;

public sealed interface StoreGameData permits SteamGameData {
    public String id = "";
}
