package com.robertforpresent.api.config.legacy;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for LegacyGameMapper.
 *
 * <p>Tests the Anti-Corruption Layer mapping from legacy parquet format
 * to the clean CanonicalGame domain model.</p>
 */
class LegacyGameMapperTest {

    private LegacyGameMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new LegacyGameMapper();
    }

    @Nested
    @DisplayName("toCanonicalGame()")
    class ToCanonicalGameTests {

        @Test
        @DisplayName("maps game name correctly")
        void mapsGameNameCorrectly() {
            // given
            LegacyGame legacy = createLegacyGame("Stardew Valley", 413150L, null, null, null);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertEquals("Stardew Valley", result.getName());
        }

        @Test
        @DisplayName("generates thumbnail URL from appId")
        void generatesThumbnailUrlFromAppId() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 413150L, null, null, null);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertEquals("https://steamcdn-a.akamaihd.net/steam/apps/413150/header.jpg",
                    result.getThumbnailUrl());
        }

        @Test
        @DisplayName("uses correctedAppId for thumbnail when available")
        void usesCorrectedAppIdForThumbnail() {
            // given
            LegacyGame legacy = createLegacyGameWithCorrectedAppId("Test Game", 12345L, 67890L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertEquals("https://steamcdn-a.akamaihd.net/steam/apps/67890/header.jpg",
                    result.getThumbnailUrl());
        }

        @Test
        @DisplayName("generates UUID for each canonical game")
        void generatesUuidForEachCanonicalGame() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, null, null, null);

            // when
            CanonicalGame result1 = mapper.toCanonicalGame(legacy);
            CanonicalGame result2 = mapper.toCanonicalGame(legacy);

            // then
            assertNotNull(result1.getId());
            assertNotNull(result2.getId());
            assertNotEquals(result1.getId(), result2.getId(), "Each mapping should generate a new UUID");
        }
    }

    @Nested
    @DisplayName("Steam rating mapping")
    class SteamRatingMappingTests {

        @Test
        @DisplayName("maps positive and negative review counts")
        void mapsPositiveAndNegativeReviewCounts() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, 100L, 20L, 8L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertNotNull(result.getRatings());
            assertNotNull(result.getRatings().steamRating());
            assertEquals(100, result.getRatings().steamRating().positiveReviews());
            assertEquals(20, result.getRatings().steamRating().negativeReviews());
        }

        @Test
        @DisplayName("maps review sentiment from score")
        void mapsReviewSentimentFromScore() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, 100L, 10L, 8L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertEquals(ReviewSentiment.VERY_POSITIVE, result.getRatings().steamRating().sentiment());
        }

        @Test
        @DisplayName("returns null rating when steamData is null")
        void returnsNullRating_whenSteamDataIsNull() {
            // given
            LegacyGame legacy = createLegacyGameWithoutSteamData("Test Game", 123L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertNull(result.getRatings().steamRating());
        }

        @Test
        @DisplayName("returns null rating when positive reviews is null")
        void returnsNullRating_whenPositiveReviewsIsNull() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, null, 10L, 5L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertNull(result.getRatings().steamRating());
        }

        @Test
        @DisplayName("returns null rating when negative reviews is null")
        void returnsNullRating_whenNegativeReviewsIsNull() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, 100L, null, 5L);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertNull(result.getRatings().steamRating());
        }

        @Test
        @DisplayName("uses UNDEFINED sentiment when reviewScore is null")
        void usesUndefinedSentiment_whenReviewScoreIsNull() {
            // given
            LegacyGame legacy = createLegacyGame("Test Game", 123L, 100L, 10L, null);

            // when
            CanonicalGame result = mapper.toCanonicalGame(legacy);

            // then
            assertNotNull(result.getRatings().steamRating());
            assertEquals(ReviewSentiment.UNDEFINED, result.getRatings().steamRating().sentiment());
        }

        @Test
        @DisplayName("maps all sentiment levels correctly")
        void mapsAllSentimentLevelsCorrectly() {
            // Test boundary scores for each sentiment
            assertSentimentForScore(0L, ReviewSentiment.UNDEFINED);
            assertSentimentForScore(1L, ReviewSentiment.OVERWHELMING_NEGATIVE);
            assertSentimentForScore(2L, ReviewSentiment.VERY_NEGATIVE);
            assertSentimentForScore(3L, ReviewSentiment.NEGATIVE);
            assertSentimentForScore(4L, ReviewSentiment.MOSTLY_NEGATIVE);
            assertSentimentForScore(5L, ReviewSentiment.MIXED);
            assertSentimentForScore(6L, ReviewSentiment.MOSTLY_POSITIVE);
            assertSentimentForScore(7L, ReviewSentiment.POSITIVE);
            assertSentimentForScore(8L, ReviewSentiment.VERY_POSITIVE);
            assertSentimentForScore(9L, ReviewSentiment.OVERWHELMING_POSITIVE);
        }

        private void assertSentimentForScore(Long score, ReviewSentiment expected) {
            LegacyGame legacy = createLegacyGame("Test", 123L, 100L, 10L, score);
            CanonicalGame result = mapper.toCanonicalGame(legacy);
            assertEquals(expected, result.getRatings().steamRating().sentiment(),
                    "Score " + score + " should map to " + expected);
        }
    }

    // Helper methods for creating test fixtures

    private LegacyGame createLegacyGame(String name, Long appId,
                                         Long positiveReviews, Long negativeReviews, Long reviewScore) {
        LegacyGame.Identity identity = new LegacyGame.Identity(
                name, null, null, "steam",
                appId, null, null, null, null, null
        );

        LegacyGame.SteamData steamData = null;
        if (positiveReviews != null || negativeReviews != null || reviewScore != null) {
            steamData = new LegacyGame.SteamData(
                    positiveReviews, negativeReviews, null, null, reviewScore, null,
                    null, null, createPlaytime(), null, null, null
            );
        }

        return new LegacyGame(
                identity, steamData, null,
                new LegacyGame.Ratings(null, null, null),
                null,
                new LegacyGame.UserState(false, false, false)
        );
    }

    private LegacyGame createLegacyGameWithoutSteamData(String name, Long appId) {
        LegacyGame.Identity identity = new LegacyGame.Identity(
                name, null, null, "steam",
                appId, null, null, null, null, null
        );

        return new LegacyGame(
                identity, null, null,
                new LegacyGame.Ratings(null, null, null),
                null,
                new LegacyGame.UserState(false, false, false)
        );
    }

    private LegacyGame createLegacyGameWithCorrectedAppId(String name, Long appId, Long correctedAppId) {
        LegacyGame.Identity identity = new LegacyGame.Identity(
                name, null, null, "steam",
                appId, correctedAppId, null, null, null, null
        );

        return new LegacyGame(
                identity, null, null,
                new LegacyGame.Ratings(null, null, null),
                null,
                new LegacyGame.UserState(false, false, false)
        );
    }

    private LegacyGame.Playtime createPlaytime() {
        return new LegacyGame.Playtime(0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L);
    }
}
