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
    private Integer steamPlaytimeMinutes; // Total playtime from Steam in minutes

    // Store ownership indicators - tracks which stores the user owns this game in
    private boolean ownedOnSteam;
    private boolean ownedOnGog;
    private boolean ownedOnEpic;
    private boolean ownedOnXbox;
    private boolean ownedOnPlayStation;
    private String otherStores; // Comma-separated list for additional stores

    private PersonalizedGame(Builder builder) {
        if (builder.gamerId == null || builder.canonicalId == null)
            throw new IllegalStateException("Both gamerId and canonicalId must be defined.");
        this.canonicalGameId = builder.canonicalId;
        this.gamerId = builder.gamerId;
        this.markedAsPlayed = builder.markAsPlayed;
        this.markedAsHidden = builder.markAsHidden;
        this.markedForLater = builder.markAsForLater;
        this.steamPlaytimeMinutes = builder.steamPlaytimeMinutes;
        this.ownedOnSteam = builder.ownedOnSteam;
        this.ownedOnGog = builder.ownedOnGog;
        this.ownedOnEpic = builder.ownedOnEpic;
        this.ownedOnXbox = builder.ownedOnXbox;
        this.ownedOnPlayStation = builder.ownedOnPlayStation;
        this.otherStores = builder.otherStores;
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

    public Integer getSteamPlaytimeMinutes() {
        return steamPlaytimeMinutes;
    }

    public void setSteamPlaytimeMinutes(Integer steamPlaytimeMinutes) {
        this.steamPlaytimeMinutes = steamPlaytimeMinutes;
    }

    public boolean isOwnedOnSteam() {
        return ownedOnSteam;
    }

    public void setOwnedOnSteam(boolean ownedOnSteam) {
        this.ownedOnSteam = ownedOnSteam;
    }

    public boolean isOwnedOnGog() {
        return ownedOnGog;
    }

    public void setOwnedOnGog(boolean ownedOnGog) {
        this.ownedOnGog = ownedOnGog;
    }

    public boolean isOwnedOnEpic() {
        return ownedOnEpic;
    }

    public void setOwnedOnEpic(boolean ownedOnEpic) {
        this.ownedOnEpic = ownedOnEpic;
    }

    public boolean isOwnedOnXbox() {
        return ownedOnXbox;
    }

    public void setOwnedOnXbox(boolean ownedOnXbox) {
        this.ownedOnXbox = ownedOnXbox;
    }

    public boolean isOwnedOnPlayStation() {
        return ownedOnPlayStation;
    }

    public void setOwnedOnPlayStation(boolean ownedOnPlayStation) {
        this.ownedOnPlayStation = ownedOnPlayStation;
    }

    public String getOtherStores() {
        return otherStores;
    }

    public void setOtherStores(String otherStores) {
        this.otherStores = otherStores;
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
        private Integer steamPlaytimeMinutes;
        private boolean ownedOnSteam;
        private boolean ownedOnGog;
        private boolean ownedOnEpic;
        private boolean ownedOnXbox;
        private boolean ownedOnPlayStation;
        private String otherStores;

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

        public Builder setSteamPlaytimeMinutes(Integer steamPlaytimeMinutes) {
            this.steamPlaytimeMinutes = steamPlaytimeMinutes;
            return this;
        }

        public Builder setOwnedOnSteam(boolean ownedOnSteam) {
            this.ownedOnSteam = ownedOnSteam;
            return this;
        }

        public Builder setOwnedOnGog(boolean ownedOnGog) {
            this.ownedOnGog = ownedOnGog;
            return this;
        }

        public Builder setOwnedOnEpic(boolean ownedOnEpic) {
            this.ownedOnEpic = ownedOnEpic;
            return this;
        }

        public Builder setOwnedOnXbox(boolean ownedOnXbox) {
            this.ownedOnXbox = ownedOnXbox;
            return this;
        }

        public Builder setOwnedOnPlayStation(boolean ownedOnPlayStation) {
            this.ownedOnPlayStation = ownedOnPlayStation;
            return this;
        }

        public Builder setOtherStores(String otherStores) {
            this.otherStores = otherStores;
            return this;
        }
    }
}
