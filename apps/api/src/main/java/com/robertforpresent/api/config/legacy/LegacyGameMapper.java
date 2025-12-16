package com.robertforpresent.api.config.legacy;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Maps legacy parquet game data to the canonical domain model.
 *
 * <p>This mapper serves as the translation layer in the Anti-Corruption Layer pattern,
 * converting the mixed-source legacy format into clean domain objects.</p>
 */
@Component
public class LegacyGameMapper {

    private static final String STEAM_THUMBNAIL_TEMPLATE =
            "https://steamcdn-a.akamaihd.net/steam/apps/%d/header.jpg";

    /**
     * Maps a LegacyGame to a CanonicalGame domain object.
     */
    public CanonicalGame toCanonicalGame(LegacyGame legacy) {
        return new CanonicalGame.Builder(legacy.resolvedName())
                .setThumbnailUrl(resolveThumbnailUrl(legacy))
                .setSteamRating(mapSteamRating(legacy))
                .build();
    }

    @Nullable
    private String resolveThumbnailUrl(LegacyGame legacy) {
        return STEAM_THUMBNAIL_TEMPLATE.replace("%d", String.valueOf(legacy.resolvedAppId()));
    }

    @Nullable
    private SteamRating mapSteamRating(LegacyGame legacy) {
        LegacyGame.SteamData steam = legacy.steamData();
        if (steam == null) {
            return null;
        }

        Long positive = steam.totalPositive();
        Long negative = steam.totalNegative();
        Long reviewScore = steam.reviewScore();

        if (positive == null || negative == null) {
            return null;
        }

        ReviewSentiment sentiment = reviewScore != null
                ? ReviewSentiment.fromScore(reviewScore.intValue())
                : ReviewSentiment.UNDEFINED;

        return SteamRating.of(positive.intValue(), negative.intValue(), sentiment);
    }

    private String steamThumbnail(long appId) {
        return String.format(STEAM_THUMBNAIL_TEMPLATE, appId);
    }
}