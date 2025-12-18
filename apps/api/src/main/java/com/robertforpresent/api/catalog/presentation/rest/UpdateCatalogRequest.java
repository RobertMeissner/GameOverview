package com.robertforpresent.api.catalog.presentation.rest;

public record UpdateCatalogRequest(
        Integer steamAppId,
        String steamName
) {
}
