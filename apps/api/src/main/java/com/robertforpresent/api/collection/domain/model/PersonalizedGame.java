package com.robertforpresent.api.collection.domain.model;

import java.util.UUID;

/**
 * A game owned by a user. It holds user-specific data and links to exactly one non-user-specific {@code CanonicalGame}
 */
public class PersonalizedGame {
    private final UUID canonicalGameId;
    private final UUID gamerId;

    private PersonalizedGame(Builder builder) {
        if (builder.gamerId == null || builder.canonicalId == null)
            throw new IllegalStateException("Both gamerId and canonicalId must be defined.");
        this.canonicalGameId = builder.canonicalId;
        this.gamerId = builder.gamerId;
    }

    public UUID getCanonicalGameId() {
        return canonicalGameId;
    }

    public UUID getGamerId() {
        return gamerId;
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

    /**
     * Explicit builder. Favoured over Lombok to have in-depth control
     */
    public static class Builder {
        private UUID canonicalId;
        private UUID gamerId;

        public Builder() {

        }

        public PersonalizedGame build() {
            return new PersonalizedGame(this);
        }

        public PersonalizedGame.Builder setCanonicalId(UUID id) {
            this.canonicalId = id;
            return this;
        }
        public PersonalizedGame.Builder setGamerId(UUID gamerId) {
            this.gamerId = gamerId;
            return this;
        }
    }
}
