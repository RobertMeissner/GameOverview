package com.robertforpresent.api.catalog.presentation.rest;

public record UpdateCatalogRequest(
        // Steam data
        Integer steamAppId,
        String steamName,
        // GoG data
        Long gogId,
        String gogName,
        String gogLink,
        // Epic Games data
        String epicId,
        String epicName,
        String epicLink,
        // Metacritic data
        Integer metacriticScore,
        String metacriticName,
        String metacriticLink
) {
}
