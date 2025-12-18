package com.robertforpresent.api.collection.domain.model;

import java.util.UUID;

/**
 * A game owned by a user. It holds user-specific data and links to exactly one non-user-specific {@code CanonicalGame}
 */
public class PersonalizedGame {
    private final UUID canonicalGameId;
    private final UUID gamerId;
    private boolean markedAsPlayed;
    private boolean markedAsHidden;
    private boolean markedForLater;

    private PersonalizedGame(Builder builder) {
        if (builder.gamerId == null || builder.canonicalId == null)
            throw new IllegalStateException("Both gamerId and canonicalId must be defined.");
        this.canonicalGameId = builder.canonicalId;
        this.gamerId = builder.gamerId;
        this.markedAsPlayed = builder.markAsPlayed;
        this.markedAsHidden = builder.markAsHidden;
        this.markedForLater = builder.markAsForLater;
    }

    public UUID getCanonicalGameId() {
        return canonicalGameId;
    }

    public UUID getGamerId() {
        return gamerId;
    }

    public boolean isMarkedForLater() {
        return markedForLater;
    }

    public void setMarkedForLater(boolean markedForLater) {
        this.markedForLater = markedForLater;
    }

    public boolean isMarkedAsHidden() {
        return markedAsHidden;
    }

    public void setMarkedAsHidden(boolean markedAsHidden) {
        this.markedAsHidden = markedAsHidden;
    }

    public boolean isMarkedAsPlayed() {
        return markedAsPlayed;
    }

    public void setMarkedAsPlayed(boolean markedAsPlayed) {
        this.markedAsPlayed = markedAsPlayed;
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
        private boolean markAsPlayed;
        private boolean markAsHidden;
        private boolean markAsForLater;

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

        public Builder setMarkAsForLater(boolean markAsForLater) {
            this.markAsForLater = markAsForLater;
            return this;
        }

        public Builder setMarkAsHidden(boolean markAsHidden) {
            this.markAsHidden = markAsHidden;
            return this;
        }

        public Builder setMarkAsPlayed(boolean markAsPlayed) {
            this.markAsPlayed = markAsPlayed;
            return this;
        }
    }
}
