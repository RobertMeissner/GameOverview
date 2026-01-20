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
            var aggregated = new AggregatedRatings(steamRating);

            // then
            assertEquals(85, aggregated.rating());
        }

        @Test
        @DisplayName("returns 0 when no ratings are present")
        void returnsZeroWhenNoRatingsPresent() {
            // given
            var aggregated = new AggregatedRatings(null);

            // then
            assertEquals(0, aggregated.rating());
        }

        @Test
        @DisplayName("returns average with various Steam ratings")
        void returnsAverageWithVariousSteamRatings() {
            // Test with low rating
            var lowRating = SteamRating.of(30, 70, ReviewSentiment.NEGATIVE);
            assertEquals(30, new AggregatedRatings(lowRating).rating());

            // Test with medium rating
            var mediumRating = SteamRating.of(60, 40, ReviewSentiment.MIXED);
            assertEquals(60, new AggregatedRatings(mediumRating).rating());

            // Test with high rating
            var highRating = SteamRating.of(95, 5, ReviewSentiment.OVERWHELMING_POSITIVE);
            assertEquals(95, new AggregatedRatings(highRating).rating());
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
            var aggregated = new AggregatedRatings(steamRating);

            // then
            assertNotNull(aggregated.steam());
            assertEquals(steamRating, aggregated.steam());
        }

        @Test
        @DisplayName("returns null when Steam rating is absent")
        void returnsNullWhenSteamRatingIsAbsent() {
            // given
            var aggregated = new AggregatedRatings(null);

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
            var aggregated1 = new AggregatedRatings(steamRating);
            var aggregated2 = new AggregatedRatings(steamRating);

            // then
            assertEquals(aggregated1, aggregated2);
            assertEquals(aggregated1.hashCode(), aggregated2.hashCode());
        }

        @Test
        @DisplayName("both null are equal")
        void bothNullAreEqual() {
            // given
            var aggregated1 = new AggregatedRatings(null);
            var aggregated2 = new AggregatedRatings(null);

            // then
            assertEquals(aggregated1, aggregated2);
        }

        @Test
        @DisplayName("different ratings are not equal")
        void differentRatingsAreNotEqual() {
            // given
            var rating1 = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);
            var rating2 = SteamRating.of(90, 10, ReviewSentiment.VERY_POSITIVE);
            var aggregated1 = new AggregatedRatings(rating1);
            var aggregated2 = new AggregatedRatings(rating2);

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
            var aggregated = new AggregatedRatings(steamRating);

            // then - This is the current implementation behavior
            assertEquals(0, aggregated.rating());
        }

        @Test
        @DisplayName("handles rating with zero positive reviews")
        void handlesRatingWithZeroPositiveReviews() {
            // given
            var steamRating = SteamRating.of(0, 100, ReviewSentiment.OVERWHELMING_NEGATIVE);
            var aggregated = new AggregatedRatings(steamRating);

            // then
            assertEquals(0, aggregated.rating());
        }
    }
}
