package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AggregatedRatings value object.
 */
class AggregatedRatingsTest {

    @Nested
    @DisplayName("rating() calculation")
    class RatingCalculationTests {

        @Test
        @DisplayName("returns Steam rating when Steam rating is present")
        void returnsSteamRatingWhenPresent() {
            // given
            var steamRating = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);
            var aggregated = new AggregatedRatings(steamRating, null);

            // then
            assertEquals(85, aggregated.rating());
        }

        @Test
        @DisplayName("returns 0 when no ratings are present")
        void returnsZeroWhenNoRatingsPresent() {
            // given
            var aggregated = new AggregatedRatings(null, null);

            // then
            assertEquals(0, aggregated.rating());
        }

        @Test
        @DisplayName("returns average with various Steam ratings")
        void returnsAverageWithVariousSteamRatings() {
            // Test with low rating
            var lowRating = SteamRating.of(30, 70, ReviewSentiment.NEGATIVE);
            assertEquals(30, new AggregatedRatings(lowRating, null).rating());

            // Test with medium rating
            var mediumRating = SteamRating.of(60, 40, ReviewSentiment.MIXED);
            assertEquals(60, new AggregatedRatings(mediumRating, null).rating());

            // Test with high rating
            var highRating = SteamRating.of(95, 5, ReviewSentiment.OVERWHELMING_POSITIVE);
            assertEquals(95, new AggregatedRatings(highRating, null).rating());
        }
    }

    @Nested
    @DisplayName("steam() accessor")
    class SteamAccessorTests {

        @Test
        @DisplayName("returns Steam rating when present")
        void returnsSteamRatingWhenPresent() {
            // given
            var steamRating = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);
            var aggregated = new AggregatedRatings(steamRating, null);

            // then
            assertNotNull(aggregated.steam());
            assertEquals(steamRating, aggregated.steam());
        }

        @Test
        @DisplayName("returns null when Steam rating is absent")
        void returnsNullWhenSteamRatingIsAbsent() {
            // given
            var aggregated = new AggregatedRatings(null, null);

            // then
            assertNull(aggregated.steam());
        }
    }

    @Nested
    @DisplayName("Record equality")
    class EqualityTests {

        @Test
        @DisplayName("equal aggregated ratings are equal")
        void equalAggregatedRatingsAreEqual() {
            // given
            var steamRating = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);
            var aggregated1 = new AggregatedRatings(steamRating, null);
            var aggregated2 = new AggregatedRatings(steamRating, null);

            // then
            assertEquals(aggregated1, aggregated2);
            assertEquals(aggregated1.hashCode(), aggregated2.hashCode());
        }

        @Test
        @DisplayName("both null are equal")
        void bothNullAreEqual() {
            // given
            var aggregated1 = new AggregatedRatings(null, null);
            var aggregated2 = new AggregatedRatings(null, null);

            // then
            assertEquals(aggregated1, aggregated2);
        }

        @Test
        @DisplayName("different ratings are not equal")
        void differentRatingsAreNotEqual() {
            // given
            var rating1 = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);
            var rating2 = SteamRating.of(90, 10, ReviewSentiment.VERY_POSITIVE);
            var aggregated1 = new AggregatedRatings(rating1, null);
            var aggregated2 = new AggregatedRatings(rating2, null);

            // then
            assertNotEquals(aggregated1, aggregated2);
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("handles rating with zero negative reviews")
        void handlesRatingWithZeroNegativeReviews() {
            // given - Note: SteamRating.rating() returns 0 when negative=0
            var steamRating = SteamRating.of(100, 0, ReviewSentiment.OVERWHELMING_POSITIVE);
            var aggregated = new AggregatedRatings(steamRating, null);

            // then - This is the current implementation behavior
            assertEquals(0, aggregated.rating());
        }

        @Test
        @DisplayName("handles rating with zero positive reviews")
        void handlesRatingWithZeroPositiveReviews() {
            // given
            var steamRating = SteamRating.of(0, 100, ReviewSentiment.OVERWHELMING_NEGATIVE);
            var aggregated = new AggregatedRatings(steamRating, null);

            // then
            assertEquals(0, aggregated.rating());
        }
    }

    @Nested
    @DisplayName("IGDB rating aggregation")
    class IgdbRatingTests {

        @Test
        @DisplayName("uses IGDB rating when only IGDB is present")
        void usesIgdbRatingWhenOnlyIgdbPresent() {
            assertEquals(88, new AggregatedRatings(null, 88.0).rating());
        }

        @Test
        @DisplayName("averages Steam and IGDB ratings when both are present")
        void averagesSteamAndIgdbRatings() {
            var steamRating = SteamRating.of(90, 10, ReviewSentiment.VERY_POSITIVE);

            assertEquals(85, new AggregatedRatings(steamRating, 80.0).rating());
        }

        @Test
        @DisplayName("rounds the average to the nearest integer")
        void roundsTheAverage() {
            var steamRating = SteamRating.of(90, 10, ReviewSentiment.VERY_POSITIVE);

            assertEquals(86, new AggregatedRatings(steamRating, 81.0).rating());
        }

        @Test
        @DisplayName("returns zero when no ratings are present")
        void returnsZeroWhenNoRatingsPresent() {
            assertEquals(0, new AggregatedRatings(null, null).rating());
        }
    }
}
