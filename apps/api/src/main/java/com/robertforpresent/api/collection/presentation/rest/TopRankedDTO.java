package com.robertforpresent.api.collection.presentation.rest;

import java.util.UUID;

public record TopRankedDTO(UUID id, String name, float rating, String thumbnailUrl) {

}
