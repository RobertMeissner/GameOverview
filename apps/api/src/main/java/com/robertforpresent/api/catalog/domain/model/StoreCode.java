package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * Canonical store/platform identifiers shared by the catalog and collection modules.
 */
public enum StoreCode {
    STEAM,
    GOG,
    EPIC,
    XBOX,
    PLAYSTATION,
    METACRITIC,
    HLTB,
    OTHER;

    /**
     * Resolves a free-form store code (e.g. from an import request) to a {@link StoreCode}.
     * Handles common aliases like "steam-family" and "ps"; unknown or null values map to {@link #OTHER}.
     */
    public static StoreCode fromCode(@Nullable String code) {
        if (code == null) {
            return OTHER;
        }
        return switch (code.toLowerCase().trim()) {
            case "steam", "steam-family", "steam-licenses" -> STEAM;
            case "gog" -> GOG;
            case "epic", "epic games", "epicgames" -> EPIC;
            case "xbox" -> XBOX;
            case "playstation", "ps", "psn" -> PLAYSTATION;
            case "metacritic" -> METACRITIC;
            case "hltb", "howlongtobeat" -> HLTB;
            default -> OTHER;
        };
    }
}
