package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;
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

    // Store-specific data
    private final @Nullable SteamGameData steamData;
    private final @Nullable GogGameData gogData;
    private final @Nullable EpicGameData epicData;
    private final @Nullable MetacriticGameData metacriticData;
    private final @Nullable HltbGameData hltbData;

    // IGDB reference
    private final @Nullable Long igdbId;
    private final @Nullable String igdbSlug;

    // Game categories/tags from IGDB
    private final List<String> genres;

    private CanonicalMetadata metadata;

    private Instant createdAt;
    private Instant updatedAt;


    public UUID getId() {
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

    public @Nullable SteamGameData getSteamData() {
        return steamData;
    }

    public @Nullable GogGameData getGogData() {
        return gogData;
    }

    public @Nullable MetacriticGameData getMetacriticData() {
        return metacriticData;
    }

    public @Nullable EpicGameData getEpicData() {
        return epicData;
    }

    public @Nullable HltbGameData getHltbData() {
        return hltbData;
    }

    public @Nullable Long getIgdbId() {
        return igdbId;
    }

    public @Nullable String getIgdbSlug() {
        return igdbSlug;
    }

    public List<String> getGenres() {
        return genres;
    }

    // Convenience methods for backward compatibility
    public @Nullable Integer getSteamAppId() {
        return steamData != null ? steamData.appId() : null;
    }

    public @Nullable String getSteamName() {
        return steamData != null ? steamData.name() : null;
    }

    /**
     * Explicit builder. Favoured over Lombok to have in-depth control
     */
    public static class Builder {
        private final String name;
        private UUID id;
        private String thumbnailUrl;
        private SteamRating steamRating;
        private SteamGameData steamData;
        private GogGameData gogData;
        private EpicGameData epicData;
        private MetacriticGameData metacriticData;
        private HltbGameData hltbData;
        private Long igdbId;
        private String igdbSlug;
        private List<String> genres = List.of();

        public Builder(String name) {
            this.name = name;
        }

        public CanonicalGame build() {
            if (id == null) {
                this.id = UUID.randomUUID();
            }
            return new CanonicalGame(this);
        }

        public Builder setId(UUID id) {
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

        public Builder setSteamData(SteamGameData steamData) {
            this.steamData = steamData;
            return this;
        }

        public Builder setGogData(GogGameData gogData) {
            this.gogData = gogData;
            return this;
        }

        public Builder setMetacriticData(MetacriticGameData metacriticData) {
            this.metacriticData = metacriticData;
            return this;
        }

        public Builder setEpicData(EpicGameData epicData) {
            this.epicData = epicData;
            return this;
        }

        public Builder setHltbData(HltbGameData hltbData) {
            this.hltbData = hltbData;
            return this;
        }

        public Builder setIgdbId(Long igdbId) {
            this.igdbId = igdbId;
            return this;
        }

        public Builder setIgdbSlug(String igdbSlug) {
            this.igdbSlug = igdbSlug;
            return this;
        }

        public Builder setGenres(List<String> genres) {
            this.genres = genres != null ? List.copyOf(genres) : List.of();
            return this;
        }

        // Convenience methods for backward compatibility
        public Builder setSteamAppId(Integer steamAppId) {
            if (this.steamData == null) {
                this.steamData = new SteamGameData(steamAppId, null);
            } else {
                this.steamData = new SteamGameData(steamAppId, this.steamData.name());
            }
            return this;
        }

        public Builder setSteamName(String steamName) {
            if (this.steamData == null) {
                this.steamData = new SteamGameData(null, steamName);
            } else {
                this.steamData = new SteamGameData(this.steamData.appId(), steamName);
            }
            return this;
        }
    }

    private CanonicalGame(Builder builder) {
        identity = new GameIdentity(builder.id, builder.name, builder.name);
        thumbnailUrl = builder.thumbnailUrl;
        steamData = builder.steamData;
        gogData = builder.gogData;
        epicData = builder.epicData;
        metacriticData = builder.metacriticData;
        hltbData = builder.hltbData;
        igdbId = builder.igdbId;
        igdbSlug = builder.igdbSlug;
        genres = builder.genres;
        createdAt = Instant.now();
        updatedAt = Instant.now();
        ratings = new AggregatedRatings(builder.steamRating);
    }
}
