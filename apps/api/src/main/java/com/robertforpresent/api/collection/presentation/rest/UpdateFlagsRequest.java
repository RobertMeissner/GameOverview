package com.robertforpresent.api.collection.presentation.rest;

public record UpdateFlagsRequest(
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater
) {
}
