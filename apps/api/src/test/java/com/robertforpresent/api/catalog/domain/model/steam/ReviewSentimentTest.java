package com.robertforpresent.api.catalog.domain.model.steam;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ReviewSentiment enum.
 */
class ReviewSentimentTest {

    @Nested
    @DisplayName("Enum values")
    class EnumValueTests {

        @Test
        @DisplayName("has all 10 sentiment values")
        void hasAll10SentimentValues() {
            // then
            assertEquals(10, ReviewSentiment.values().length);
        }

        @Test
        @DisplayName("values are in correct order")
        void valuesAreInCorrectOrder() {
            // given
            var values = ReviewSentiment.values();

            // then
            assertEquals(ReviewSentiment.UNDEFINED, values[0]);
            assertEquals(ReviewSentiment.OVERWHELMING_NEGATIVE, values[1]);
            assertEquals(ReviewSentiment.VERY_NEGATIVE, values[2]);
            assertEquals(ReviewSentiment.NEGATIVE, values[3]);
            assertEquals(ReviewSentiment.MOSTLY_NEGATIVE, values[4]);
            assertEquals(ReviewSentiment.MIXED, values[5]);
            assertEquals(ReviewSentiment.MOSTLY_POSITIVE, values[6]);
            assertEquals(ReviewSentiment.POSITIVE, values[7]);
            assertEquals(ReviewSentiment.VERY_POSITIVE, values[8]);
            assertEquals(ReviewSentiment.OVERWHELMING_POSITIVE, values[9]);
        }
    }

    @Nested
    @DisplayName("score()")
    class ScoreTests {

        @ParameterizedTest(name = "{0} has score {1}")
        @MethodSource("sentimentScorePairs")
        @DisplayName("returns correct score for each sentiment")
        void returnsCorrectScoreForEachSentiment(ReviewSentiment sentiment, int expectedScore) {
            assertEquals(expectedScore, sentiment.score());
        }

        static Stream<Arguments> sentimentScorePairs() {
            return Stream.of(
                    Arguments.of(ReviewSentiment.UNDEFINED, 0),
                    Arguments.of(ReviewSentiment.OVERWHELMING_NEGATIVE, 1),
                    Arguments.of(ReviewSentiment.VERY_NEGATIVE, 2),
                    Arguments.of(ReviewSentiment.NEGATIVE, 3),
                    Arguments.of(ReviewSentiment.MOSTLY_NEGATIVE, 4),
                    Arguments.of(ReviewSentiment.MIXED, 5),
                    Arguments.of(ReviewSentiment.MOSTLY_POSITIVE, 6),
                    Arguments.of(ReviewSentiment.POSITIVE, 7),
                    Arguments.of(ReviewSentiment.VERY_POSITIVE, 8),
                    Arguments.of(ReviewSentiment.OVERWHELMING_POSITIVE, 9)
            );
        }
    }

    @Nested
    @DisplayName("displayName()")
    class DisplayNameTests {

        @ParameterizedTest(name = "{0} has display name \"{1}\"")
        @MethodSource("sentimentDisplayNamePairs")
        @DisplayName("returns correct display name for each sentiment")
        void returnsCorrectDisplayNameForEachSentiment(ReviewSentiment sentiment, String expectedDisplayName) {
            assertEquals(expectedDisplayName, sentiment.displayName());
        }

        static Stream<Arguments> sentimentDisplayNamePairs() {
            return Stream.of(
                    Arguments.of(ReviewSentiment.UNDEFINED, "Undefined"),
                    Arguments.of(ReviewSentiment.OVERWHELMING_NEGATIVE, "Overwhelmingly Negative"),
                    Arguments.of(ReviewSentiment.VERY_NEGATIVE, "Very Negative"),
                    Arguments.of(ReviewSentiment.NEGATIVE, "Negative"),
                    Arguments.of(ReviewSentiment.MOSTLY_NEGATIVE, "Mostly Negative"),
                    Arguments.of(ReviewSentiment.MIXED, "Mixed"),
                    Arguments.of(ReviewSentiment.MOSTLY_POSITIVE, "Mostly Positive"),
                    Arguments.of(ReviewSentiment.POSITIVE, "Positive"),
                    Arguments.of(ReviewSentiment.VERY_POSITIVE, "Very Positive"),
                    Arguments.of(ReviewSentiment.OVERWHELMING_POSITIVE, "Overwhelmingly Positive")
            );
        }
    }

    @Nested
    @DisplayName("fromScore()")
    class FromScoreTests {

        @ParameterizedTest(name = "score {0} returns {1}")
        @MethodSource("scoreToSentimentPairs")
        @DisplayName("returns correct sentiment for valid scores")
        void returnsCorrectSentimentForValidScores(int score, ReviewSentiment expectedSentiment) {
            assertEquals(expectedSentiment, ReviewSentiment.fromScore(score));
        }

        static Stream<Arguments> scoreToSentimentPairs() {
            return Stream.of(
                    Arguments.of(0, ReviewSentiment.UNDEFINED),
                    Arguments.of(1, ReviewSentiment.OVERWHELMING_NEGATIVE),
                    Arguments.of(2, ReviewSentiment.VERY_NEGATIVE),
                    Arguments.of(3, ReviewSentiment.NEGATIVE),
                    Arguments.of(4, ReviewSentiment.MOSTLY_NEGATIVE),
                    Arguments.of(5, ReviewSentiment.MIXED),
                    Arguments.of(6, ReviewSentiment.MOSTLY_POSITIVE),
                    Arguments.of(7, ReviewSentiment.POSITIVE),
                    Arguments.of(8, ReviewSentiment.VERY_POSITIVE),
                    Arguments.of(9, ReviewSentiment.OVERWHELMING_POSITIVE)
            );
        }

        @Test
        @DisplayName("returns UNDEFINED for invalid positive score")
        void returnsUndefinedForInvalidPositiveScore() {
            // when
            var result = ReviewSentiment.fromScore(99);

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }

        @Test
        @DisplayName("returns UNDEFINED for negative score")
        void returnsUndefinedForNegativeScore() {
            // when
            var result = ReviewSentiment.fromScore(-1);

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }
    }

    @Nested
    @DisplayName("fromDisplayName()")
    class FromDisplayNameTests {

        @ParameterizedTest(name = "display name \"{0}\" returns {1}")
        @MethodSource("displayNameToSentimentPairs")
        @DisplayName("returns correct sentiment for valid display names")
        void returnsCorrectSentimentForValidDisplayNames(String displayName, ReviewSentiment expectedSentiment) {
            assertEquals(expectedSentiment, ReviewSentiment.fromDisplayName(displayName));
        }

        static Stream<Arguments> displayNameToSentimentPairs() {
            return Stream.of(
                    Arguments.of("Undefined", ReviewSentiment.UNDEFINED),
                    Arguments.of("Overwhelmingly Negative", ReviewSentiment.OVERWHELMING_NEGATIVE),
                    Arguments.of("Very Negative", ReviewSentiment.VERY_NEGATIVE),
                    Arguments.of("Negative", ReviewSentiment.NEGATIVE),
                    Arguments.of("Mostly Negative", ReviewSentiment.MOSTLY_NEGATIVE),
                    Arguments.of("Mixed", ReviewSentiment.MIXED),
                    Arguments.of("Mostly Positive", ReviewSentiment.MOSTLY_POSITIVE),
                    Arguments.of("Positive", ReviewSentiment.POSITIVE),
                    Arguments.of("Very Positive", ReviewSentiment.VERY_POSITIVE),
                    Arguments.of("Overwhelmingly Positive", ReviewSentiment.OVERWHELMING_POSITIVE)
            );
        }

        @Test
        @DisplayName("returns UNDEFINED for unknown display name")
        void returnsUndefinedForUnknownDisplayName() {
            // when
            var result = ReviewSentiment.fromDisplayName("Unknown");

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }

        @Test
        @DisplayName("returns UNDEFINED for empty display name")
        void returnsUndefinedForEmptyDisplayName() {
            // when
            var result = ReviewSentiment.fromDisplayName("");

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }

        @Test
        @DisplayName("returns UNDEFINED for null display name")
        void returnsUndefinedForNullDisplayName() {
            // when
            var result = ReviewSentiment.fromDisplayName(null);

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }

        @Test
        @DisplayName("is case-sensitive")
        void isCaseSensitive() {
            // when - using lowercase
            var result = ReviewSentiment.fromDisplayName("positive");

            // then
            assertEquals(ReviewSentiment.UNDEFINED, result);
        }
    }

    @Nested
    @DisplayName("Round-trip conversions")
    class RoundTripTests {

        @Test
        @DisplayName("fromScore and score are inverse operations")
        void fromScoreAndScoreAreInverse() {
            for (ReviewSentiment sentiment : ReviewSentiment.values()) {
                int score = sentiment.score();
                ReviewSentiment roundTripped = ReviewSentiment.fromScore(score);
                assertEquals(sentiment, roundTripped,
                        "Round trip failed for " + sentiment);
            }
        }

        @Test
        @DisplayName("fromDisplayName and displayName are inverse operations")
        void fromDisplayNameAndDisplayNameAreInverse() {
            for (ReviewSentiment sentiment : ReviewSentiment.values()) {
                String displayName = sentiment.displayName();
                ReviewSentiment roundTripped = ReviewSentiment.fromDisplayName(displayName);
                assertEquals(sentiment, roundTripped,
                        "Round trip failed for " + sentiment);
            }
        }
    }
}
