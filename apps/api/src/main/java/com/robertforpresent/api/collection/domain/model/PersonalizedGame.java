package com.robertforpresent.api.collection.domain.model;

import java.util.UUID;

/**
 * A game owned by a user. It holds user-specific data and links to exactly one non-user-specific {@code CanonicalGame}
 */
public class PersonalizedGame {
    private final UUID canonicalGameId;

    public PersonalizedGame(UUID canonicalGameId) {
        this.canonicalGameId = canonicalGameId;
    }


    /**
     * To implement
     * addGame
     * markAsPlayed
     * markAsHide
     * toBacklog
     * like
     * dislike
     * recommend
     * recommendToUser
     * gotoStore
     */
}
