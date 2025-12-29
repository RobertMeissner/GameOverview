package com.robertforpresent.api.catalog.presentation.rest;

import java.util.List;
import java.util.UUID;

/**
 * DTO representing a group of duplicate canonical games (same name).
 */
public record CatalogDuplicateGroup(
        String name,
        List<CatalogGameEntry> games
) {
    public record CatalogGameEntry(
            UUID id,
            String name,
            String thumbnailUrl,
            float rating,
            Integer steamAppId,
            String steamName,
            Long gogId,
            String gogName,
            Long igdbId,
            Integer metacriticScore
    ) {}
}
