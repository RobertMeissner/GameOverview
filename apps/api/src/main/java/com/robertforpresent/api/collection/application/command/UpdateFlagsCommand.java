package com.robertforpresent.api.collection.application.command;

/**
 * Command to update the played/hidden/for-later flags of a game in a gamer's collection.
 */
public record UpdateFlagsCommand(
        boolean markedAsPlayed,
        boolean markedAsHidden,
        boolean markedForLater
) {
}
