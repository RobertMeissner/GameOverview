package com.robertforpresent.api.games.domain.model;

public sealed interface StoreGameData permits SteamGameData {
    public String id = "";
}
