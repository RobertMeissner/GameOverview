package com.robertforpresent.api.collection.application.dto;

/**
 * DTO containing links to various game stores.
 */
public record StoreLinksDTO(
        String steamLink,
        String gogLink,
        String metacriticLink
) {
}
