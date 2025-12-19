package com.robertforpresent.api.catalog.domain.model.legacy;

import java.util.Objects;

/**
 * Legacy record representing a game schema with data from multiple sources
 * (Steam, GOG, Metacritic, HowLongToBeat).
 */
public record LegacyData(
        // Basic game information
        String name,
        String store,
        Boolean played,
        Long appId,
        String backgroundImage,
        String cdKey,
        String textInformation,

        // Download information
        String downloads,
        String galaxyDownloads,
        String extras,
        String dlcs,

        // Metadata
        String tags,
        String isPreOrder,
        Long releaseTimestamp,
        String messages,
        String changelog,
        String forumLink,
        String isBaseProductMissing,
        String missingBaseProduct,
        String features,
        String simpleGalaxyInstallers,

        // Steam review data
        Long numReviews,
        Long reviewScore,
        Long totalPositive,
        Long totalNegative,
        Long totalReviews,
        String foundGameName,
        Float rating,
        String reviewScoreDesc,

        // Display/filtering
        Boolean hide,
        String url,
        Long correctedAppId,

        // Playtime statistics
        Long playtimeForever,
        String imgIconUrl,
        String hasCommunityVisibleStats,
        Long playtimeWindowsForever,
        Long playtimeMacForever,
        Long playtimeLinuxForever,
        Long playtimeDeckForever,
        Long rtimeLastPlayed,
        Long playtimeDisconnected,
        String hasLeaderboards,
        String contentDescriptorids,
        Long playtime2weeks,

        // Identifiers
        String gameHash,
        Long gogId,
        String title,

        // GOG specific
        Long reviewsRating,
        String coverVertical,
        String coverHorizontal,
        String storeLink,
        Boolean later,
        String thumbnailUrl,

        // Metacritic data
        Long metacriticScore,
        String metacriticGameName,

        // HowLongToBeat data
        Double hltbMainStory,
        Long hltbMainExtra,
        Long hltbCompletionist,
        Long hltbGameId,
        Long hltbSimilarity,

        // Computed metrics
        Double mcHltbRatio
) {
    /**
     * Builder class for GameSchema to handle the large number of optional fields.
     */
    public static class Builder {
        private String name;
        private String store;
        private Boolean played;
        private Long appId;
        private String backgroundImage;
        private String cdKey;
        private String textInformation;
        private String downloads;
        private String galaxyDownloads;
        private String extras;
        private String dlcs;
        private String tags;
        private String isPreOrder;
        private Long releaseTimestamp;
        private String messages;
        private String changelog;
        private String forumLink;
        private String isBaseProductMissing;
        private String missingBaseProduct;
        private String features;
        private String simpleGalaxyInstallers;
        private Long numReviews;
        private Long reviewScore;
        private Long totalPositive;
        private Long totalNegative;
        private Long totalReviews;
        private String foundGameName;
        private Float rating;
        private String reviewScoreDesc;
        private Boolean hide;
        private String url;
        private Long correctedAppId;
        private Long playtimeForever;
        private String imgIconUrl;
        private String hasCommunityVisibleStats;
        private Long playtimeWindowsForever;
        private Long playtimeMacForever;
        private Long playtimeLinuxForever;
        private Long playtimeDeckForever;
        private Long rtimeLastPlayed;
        private Long playtimeDisconnected;
        private String hasLeaderboards;
        private String contentDescriptorids;
        private Long playtime2weeks;
        private String gameHash;
        private Long gogId;
        private String title;
        private Long reviewsRating;
        private String coverVertical;
        private String coverHorizontal;
        private String storeLink;
        private Boolean later;
        private String thumbnailUrl;
        private Long metacriticScore;
        private String metacriticGameName;
        private Double hltbMainStory;
        private Long hltbMainExtra;
        private Long hltbCompletionist;
        private Long hltbGameId;
        private Long hltbSimilarity;
        private Double mcHltbRatio;

        public Builder name(String name) { this.name = name; return this; }
        public Builder store(String store) { this.store = store; return this; }
        public Builder played(Boolean played) { this.played = played; return this; }
        public Builder appId(Long appId) { this.appId = appId; return this; }
        public Builder backgroundImage(String backgroundImage) { this.backgroundImage = backgroundImage; return this; }
        public Builder cdKey(String cdKey) { this.cdKey = cdKey; return this; }
        public Builder textInformation(String textInformation) { this.textInformation = textInformation; return this; }
        public Builder downloads(String downloads) { this.downloads = downloads; return this; }
        public Builder galaxyDownloads(String galaxyDownloads) { this.galaxyDownloads = galaxyDownloads; return this; }
        public Builder extras(String extras) { this.extras = extras; return this; }
        public Builder dlcs(String dlcs) { this.dlcs = dlcs; return this; }
        public Builder tags(String tags) { this.tags = tags; return this; }
        public Builder isPreOrder(String isPreOrder) { this.isPreOrder = isPreOrder; return this; }
        public Builder releaseTimestamp(Long releaseTimestamp) { this.releaseTimestamp = releaseTimestamp; return this; }
        public Builder messages(String messages) { this.messages = messages; return this; }
        public Builder changelog(String changelog) { this.changelog = changelog; return this; }
        public Builder forumLink(String forumLink) { this.forumLink = forumLink; return this; }
        public Builder isBaseProductMissing(String isBaseProductMissing) { this.isBaseProductMissing = isBaseProductMissing; return this; }
        public Builder missingBaseProduct(String missingBaseProduct) { this.missingBaseProduct = missingBaseProduct; return this; }
        public Builder features(String features) { this.features = features; return this; }
        public Builder simpleGalaxyInstallers(String simpleGalaxyInstallers) { this.simpleGalaxyInstallers = simpleGalaxyInstallers; return this; }
        public Builder numReviews(Long numReviews) { this.numReviews = numReviews; return this; }
        public Builder reviewScore(Long reviewScore) { this.reviewScore = reviewScore; return this; }
        public Builder totalPositive(Long totalPositive) { this.totalPositive = totalPositive; return this; }
        public Builder totalNegative(Long totalNegative) { this.totalNegative = totalNegative; return this; }
        public Builder totalReviews(Long totalReviews) { this.totalReviews = totalReviews; return this; }
        public Builder foundGameName(String foundGameName) { this.foundGameName = foundGameName; return this; }
        public Builder rating(Float rating) { this.rating = rating; return this; }
        public Builder reviewScoreDesc(String reviewScoreDesc) { this.reviewScoreDesc = reviewScoreDesc; return this; }
        public Builder hide(Boolean hide) { this.hide = hide; return this; }
        public Builder url(String url) { this.url = url; return this; }
        public Builder correctedAppId(Long correctedAppId) { this.correctedAppId = correctedAppId; return this; }
        public Builder playtimeForever(Long playtimeForever) { this.playtimeForever = playtimeForever; return this; }
        public Builder imgIconUrl(String imgIconUrl) { this.imgIconUrl = imgIconUrl; return this; }
        public Builder hasCommunityVisibleStats(String hasCommunityVisibleStats) { this.hasCommunityVisibleStats = hasCommunityVisibleStats; return this; }
        public Builder playtimeWindowsForever(Long playtimeWindowsForever) { this.playtimeWindowsForever = playtimeWindowsForever; return this; }
        public Builder playtimeMacForever(Long playtimeMacForever) { this.playtimeMacForever = playtimeMacForever; return this; }
        public Builder playtimeLinuxForever(Long playtimeLinuxForever) { this.playtimeLinuxForever = playtimeLinuxForever; return this; }
        public Builder playtimeDeckForever(Long playtimeDeckForever) { this.playtimeDeckForever = playtimeDeckForever; return this; }
        public Builder rtimeLastPlayed(Long rtimeLastPlayed) { this.rtimeLastPlayed = rtimeLastPlayed; return this; }
        public Builder playtimeDisconnected(Long playtimeDisconnected) { this.playtimeDisconnected = playtimeDisconnected; return this; }
        public Builder hasLeaderboards(String hasLeaderboards) { this.hasLeaderboards = hasLeaderboards; return this; }
        public Builder contentDescriptorids(String contentDescriptorids) { this.contentDescriptorids = contentDescriptorids; return this; }
        public Builder playtime2weeks(Long playtime2weeks) { this.playtime2weeks = playtime2weeks; return this; }
        public Builder gameHash(String gameHash) { this.gameHash = gameHash; return this; }
        public Builder gogId(Long gogId) { this.gogId = gogId; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder reviewsRating(Long reviewsRating) { this.reviewsRating = reviewsRating; return this; }
        public Builder coverVertical(String coverVertical) { this.coverVertical = coverVertical; return this; }
        public Builder coverHorizontal(String coverHorizontal) { this.coverHorizontal = coverHorizontal; return this; }
        public Builder storeLink(String storeLink) { this.storeLink = storeLink; return this; }
        public Builder later(Boolean later) { this.later = later; return this; }
        public Builder thumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; return this; }
        public Builder metacriticScore(Long metacriticScore) { this.metacriticScore = metacriticScore; return this; }
        public Builder metacriticGameName(String metacriticGameName) { this.metacriticGameName = metacriticGameName; return this; }
        public Builder hltbMainStory(Double hltbMainStory) { this.hltbMainStory = hltbMainStory; return this; }
        public Builder hltbMainExtra(Long hltbMainExtra) { this.hltbMainExtra = hltbMainExtra; return this; }
        public Builder hltbCompletionist(Long hltbCompletionist) { this.hltbCompletionist = hltbCompletionist; return this; }
        public Builder hltbGameId(Long hltbGameId) { this.hltbGameId = hltbGameId; return this; }
        public Builder hltbSimilarity(Long hltbSimilarity) { this.hltbSimilarity = hltbSimilarity; return this; }
        public Builder mcHltbRatio(Double mcHltbRatio) { this.mcHltbRatio = mcHltbRatio; return this; }

        public LegacyData build() {
            return new LegacyData(
                    name, store, played, appId, backgroundImage, cdKey, textInformation,
                    downloads, galaxyDownloads, extras, dlcs, tags, isPreOrder,
                    releaseTimestamp, messages, changelog, forumLink, isBaseProductMissing,
                    missingBaseProduct, features, simpleGalaxyInstallers, numReviews,
                    reviewScore, totalPositive, totalNegative, totalReviews, foundGameName,
                    rating, reviewScoreDesc, hide, url, correctedAppId, playtimeForever,
                    imgIconUrl, hasCommunityVisibleStats, playtimeWindowsForever,
                    playtimeMacForever, playtimeLinuxForever, playtimeDeckForever,
                    rtimeLastPlayed, playtimeDisconnected, hasLeaderboards,
                    contentDescriptorids, playtime2weeks, gameHash, gogId, title,
                    reviewsRating, coverVertical, coverHorizontal, storeLink, later,
                    thumbnailUrl, metacriticScore, metacriticGameName, hltbMainStory,
                    hltbMainExtra, hltbCompletionist, hltbGameId, hltbSimilarity, mcHltbRatio
            );
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Returns the display name, preferring 'name' over 'title'.
     */
    public String displayName() {
        return name != null ? name : title;
    }

    /**
     * Returns total playtime across all platforms in minutes.
     */
    public long totalPlaytimeMinutes() {
        return Objects.requireNonNullElse(playtimeForever, 0L);
    }

    /**
     * Returns total playtime formatted as hours.
     */
    public double totalPlaytimeHours() {
        return totalPlaytimeMinutes() / 60.0;
    }

    /**
     * Checks if this game has been played.
     */
    public boolean hasBeenPlayed() {
        return Boolean.TRUE.equals(played) || totalPlaytimeMinutes() > 0;
    }

    /**
     * Returns the positive review percentage (0-100), or null if no reviews.
     */
    public Double positiveReviewPercentage() {
        if (totalReviews == null || totalReviews == 0) {
            return null;
        }
        long positive = Objects.requireNonNullElse(totalPositive, 0L);
        return (positive * 100.0) / totalReviews;
    }
}