package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A unified game identity aggregated from several sources, e.g. stores, meta plattforms, and such.
 *
 * <p>The core aggregate (? or entity) of the game catalog domain. </p>
 *
 * <h2>Decisions</h2>
 * <ul>
 *     <li>Generates its own UUID</li>
 *     <li>Store data is preserved in its raw form</li>
 * </ul>
 *
 * <h2>Invariants</h2>
 * <ul>
 *     <li>A game has at least a canonical name</li>
 *     <li>Store data map never contains null values</li>
 * </ul>
 */

public class CanonicalGame {
    GameIdentity identity;
    AggregatedRatings ratings;
    private final String thumbnailUrl;

    private CanonicalMetadata metadata;

    private final Map<GameStore, StoreGameData> storeData;

    private Instant createdAt;
    private Instant updatedAt;


    public String getId() {
        return identity.id();
    }

    public String getName() {
        return this.identity.name();
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public float getRating() {
        return ratings.rating();
    }

    public AggregatedRatings getRatings() {
        return ratings;
    }

    /**
     * Explicit builder. Favoured over Lombok to have in-depth control
     */
    public static class Builder {
        private final String name;
        private String id;
        private String thumbnailUrl;
        private SteamRating steamRating;

        public Builder(String name) {
            this.name = name;
        }

        public CanonicalGame build() {
            if (id == null) {
                this.id = String.valueOf(UUID.randomUUID());
            }
            return new CanonicalGame(this);
        }

        public Builder setId(String id) {
            this.id = id;
            return this;
        }

        public Builder setThumbnailUrl(String thumbnailUrl) {
            this.thumbnailUrl = thumbnailUrl;
            return this;
        }

        public Builder setSteamRating(SteamRating rating) {
            this.steamRating = rating;
            return this;
        }
    }

    private CanonicalGame(Builder builder) {
        identity = new GameIdentity(builder.id, builder.name, builder.name);
        thumbnailUrl = builder.thumbnailUrl;
        storeData = Map.of();
        createdAt = Instant.now();
        updatedAt = Instant.now();
        ratings = new AggregatedRatings(builder.steamRating);
    }
}
