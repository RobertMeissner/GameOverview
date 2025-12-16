package com.robertforpresent.api.config.legacy;

import org.jspecify.annotations.Nullable;

/**
 * Represents a game record from the legacy parquet data file.
 *
 * <p>This is a read-only data structure that captures the mixed-source legacy format
 * containing Steam, GOG and other sources. It serves as an Anti-Corruption Layer
 * between the legacy data format and the clean domain model.</p>
 *
 * @param identity  Core identification fields (name, store, IDs)
 * @param steamData Steam-specific data (reviews, playtime)
 * @param gogData   GOG-specific data (assets, downloads)
 * @param ratings   Aggregated ratings from various sources
 * @param hltbData  How Long To Beat timing data
 * @param userState User-specific state (played, hide, later)
 */
public record LegacyGame(Identity identity,
                         @Nullable SteamData steamData,
                         @Nullable GogData gogData,
                         Ratings ratings,
                         @Nullable HltbData hltbData,
                         UserState userState) {
    public record Identity(
            @Nullable String name,
            @Nullable String title,
            @Nullable String foundGameName,
            @Nullable String store,
            @Nullable Long appId,
            @Nullable Long correctedAppId,
           @Nullable Long gogId,
            @Nullable String gameHash,
            @Nullable String url,
            @Nullable String thumbnailUrl
    ){}

    public record SteamData(
            @Nullable Long totalPositive,
            @Nullable Long totalNegative,
            @Nullable Long totalReviews,
            @Nullable Long numReviews,
            @Nullable Long reviewScore,
            @Nullable String reviewScoreDesc,
            @Nullable Float rating,
            @Nullable String imgIconUrl,
            Playtime playtime,
            @Nullable String hasCommunityVisibleStats,
            @Nullable String hasLeaderboards,
            @Nullable String contentDescriptorIds
    ) {
    }

    public record Playtime(
            @Nullable Long forever,
            @Nullable Long windowsForever,
            @Nullable Long macForever,
            @Nullable Long linuxForever,
            @Nullable Long deckForever,
            @Nullable Long twoWeeks,
            @Nullable Long disconnected,
            @Nullable Long rtimeLastPlayed
    ) {
    }

    public record GogData(
            @Nullable String backgroundImage,
            @Nullable String coverVertical,
            @Nullable String coverHorizontal,
            @Nullable String cdKey,
            @Nullable String textInformation,
            @Nullable String downloads,
            @Nullable String galaxyDownloads,
            @Nullable String extras,
            @Nullable String dlcs,
            @Nullable String tags,
            @Nullable String features,
            @Nullable String isPreOrder,
            @Nullable Long releaseTimestamp,
            @Nullable String messages,
            @Nullable String changelog,
            @Nullable String forumLink,
            @Nullable String storeLink,
            @Nullable String isBaseProductMissing,
            @Nullable String missingBaseProduct,
            @Nullable String simpleGalaxyInstallers,
            @Nullable Long reviewsRating
    ) {
    }

    public record Ratings(
            @Nullable Long metacriticScore,
            @Nullable String metacriticGameName,
            @Nullable Double mcHltbRatio
    ) {
    }

    public record HltbData(
            @Nullable Double mainStory,
            @Nullable Long mainExtra,
            @Nullable Long completionist,
            @Nullable Long gameId,
            @Nullable Long similarity
    ) {
    }

    public record UserState(
            boolean played,
            boolean hide,
            boolean later
    ) {
    }

    /**
     * Returns the best available name for this game.
     * Prioritizes: name -> title -> foundGameName -> "Unknown"
     */
    public String resolvedName() {
        if (identity.name() != null && !identity.name().isBlank()) {
            return identity.name();
        }
        if (identity.title() != null && !identity.title().isBlank()) {
            return identity.title();
        }
        if (identity.foundGameName() != null && !identity.foundGameName().isBlank()) {
            return identity.foundGameName();
        }
        return "Unknown";
    }

    /**
     * Returns the best available Steam app ID.
     * Prioritizes correctedAppId over appId.
     */
    public @Nullable Long resolvedAppId() {
        return (identity.correctedAppId() != null && identity.correctedAppId() != 0) ? identity.correctedAppId() : identity.appId();
    }
}
