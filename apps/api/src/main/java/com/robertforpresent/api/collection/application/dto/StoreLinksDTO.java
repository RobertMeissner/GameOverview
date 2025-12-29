package com.robertforpresent.api.collection.application.dto;

/**
 * DTO containing links and ratings for various game stores.
 */
public record StoreLinksDTO(
        String steamLink,
        Float steamRating,
        String gogLink,
        String metacriticLink,
        Integer metacriticScore
) {
}
