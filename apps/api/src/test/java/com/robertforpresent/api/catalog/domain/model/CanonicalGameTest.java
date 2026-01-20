package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CanonicalGame aggregate root.
 */
class CanonicalGameTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("builds game with required name")
        void buildsGameWithRequiredName() {
            // when
            var game = new CanonicalGame.Builder("Stardew Valley").build();

            // then
            assertEquals("Stardew Valley", game.getName());
            assertNotNull(game.getId());
        }

        @Test
        @DisplayName("generates UUID when not provided")
        void generatesUuidWhenNotProvided() {
            // when
            var game1 = new CanonicalGame.Builder("Game 1").build();
            var game2 = new CanonicalGame.Builder("Game 2").build();

            // then
            assertNotNull(game1.getId());
            assertNotNull(game2.getId());
            assertNotEquals(game1.getId(), game2.getId());
        }

        @Test
        @DisplayName("uses provided UUID")
        void usesProvidedUuid() {
            // given
            UUID customId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setId(customId)
                    .build();

            // then
            assertEquals(customId, game.getId());
        }

        @Test
        @DisplayName("sets thumbnail URL")
        void setsThumbnailUrl() {
            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setThumbnailUrl("https://example.com/thumb.jpg")
                    .build();

            // then
            assertEquals("https://example.com/thumb.jpg", game.getThumbnailUrl());
        }

        @Test
        @DisplayName("sets Steam rating and calculates rating")
        void setsSteamRating() {
            // given
            var steamRating = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);

            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamRating(steamRating)
                    .build();

            // then
            assertEquals(steamRating, game.getRatings().steam());
            assertEquals(85, game.getRating());
        }

        @Test
        @DisplayName("sets Steam data")
        void setsSteamData() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley");

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setSteamData(steamData)
                    .build();

            // then
            assertNotNull(game.getSteamData());
            assertEquals(413150, game.getSteamData().appId());
            assertEquals("Stardew Valley", game.getSteamData().name());
        }

        @Test
        @DisplayName("sets GOG data")
        void setsGogData() {
            // given
            var gogData = new GogGameData(1234567890L, "Stardew Valley", "https://www.gog.com/game/stardew_valley");

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setGogData(gogData)
                    .build();

            // then
            assertNotNull(game.getGogData());
            assertEquals(1234567890L, game.getGogData().gogId());
        }

        @Test
        @DisplayName("sets Epic data")
        void setsEpicData() {
            // given
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", "https://store.epicgames.com/p/stardew-valley");

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setEpicData(epicData)
                    .build();

            // then
            assertNotNull(game.getEpicData());
            assertEquals("stardew-valley", game.getEpicData().epicId());
        }

        @Test
        @DisplayName("sets Metacritic data")
        void setsMetacriticData() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setMetacriticData(metacriticData)
                    .build();

            // then
            assertNotNull(game.getMetacriticData());
            assertEquals(89, game.getMetacriticData().score());
        }

        @Test
        @DisplayName("sets HLTB data")
        void setsHltbData() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setHltbData(hltbData)
                    .build();

            // then
            assertNotNull(game.getHltbData());
            assertEquals(52.0, game.getHltbData().mainStoryHours());
        }

        @Test
        @DisplayName("sets IGDB data")
        void setsIgdbData() {
            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setIgdbId(17000L)
                    .setIgdbSlug("stardew-valley")
                    .build();

            // then
            assertEquals(17000L, game.getIgdbId());
            assertEquals("stardew-valley", game.getIgdbSlug());
        }

        @Test
        @DisplayName("sets genres with defensive copy")
        void setsGenresWithDefensiveCopy() {
            // given
            var genres = List.of("Simulation", "RPG", "Indie");

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setGenres(genres)
                    .build();

            // then
            assertEquals(3, game.getGenres().size());
            assertTrue(game.getGenres().contains("Simulation"));
            assertTrue(game.getGenres().contains("RPG"));
        }

        @Test
        @DisplayName("handles null genres by using empty list")
        void handlesNullGenres() {
            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setGenres(null)
                    .build();

            // then
            assertNotNull(game.getGenres());
            assertTrue(game.getGenres().isEmpty());
        }

        @Test
        @DisplayName("builds complete game with all data")
        void buildsCompleteGame() {
            // given
            UUID id = UUID.randomUUID();
            var steamRating = SteamRating.of(90, 10, ReviewSentiment.VERY_POSITIVE);
            var steamData = new SteamGameData(413150, "Stardew Valley");
            var gogData = new GogGameData(123L, "Stardew Valley GOG", "https://gog.com/stardew");
            var epicData = new EpicGameData("stardew", "Stardew Valley Epic", "https://epic.com/stardew");
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);
            var genres = List.of("Simulation", "RPG");

            // when
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setId(id)
                    .setThumbnailUrl("https://example.com/thumb.jpg")
                    .setSteamRating(steamRating)
                    .setSteamData(steamData)
                    .setGogData(gogData)
                    .setEpicData(epicData)
                    .setMetacriticData(metacriticData)
                    .setHltbData(hltbData)
                    .setIgdbId(17000L)
                    .setIgdbSlug("stardew-valley")
                    .setGenres(genres)
                    .build();

            // then
            assertEquals(id, game.getId());
            assertEquals("Stardew Valley", game.getName());
            assertEquals("https://example.com/thumb.jpg", game.getThumbnailUrl());
            assertEquals(90, game.getRating());
            assertNotNull(game.getSteamData());
            assertNotNull(game.getGogData());
            assertNotNull(game.getEpicData());
            assertNotNull(game.getMetacriticData());
            assertNotNull(game.getHltbData());
            assertEquals(17000L, game.getIgdbId());
            assertEquals("stardew-valley", game.getIgdbSlug());
            assertEquals(2, game.getGenres().size());
        }
    }

    @Nested
    @DisplayName("Convenience accessors")
    class ConvenienceAccessorTests {

        @Test
        @DisplayName("getSteamAppId returns app ID from Steam data")
        void getSteamAppIdReturnsAppId() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley");
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setSteamData(steamData)
                    .build();

            // then
            assertEquals(413150, game.getSteamAppId());
        }

        @Test
        @DisplayName("getSteamAppId returns null when no Steam data")
        void getSteamAppIdReturnsNullWhenNoSteamData() {
            // given
            var game = new CanonicalGame.Builder("Test Game").build();

            // then
            assertNull(game.getSteamAppId());
        }

        @Test
        @DisplayName("getSteamName returns name from Steam data")
        void getSteamNameReturnsName() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley Steam");
            var game = new CanonicalGame.Builder("Stardew Valley")
                    .setSteamData(steamData)
                    .build();

            // then
            assertEquals("Stardew Valley Steam", game.getSteamName());
        }

        @Test
        @DisplayName("getSteamName returns null when no Steam data")
        void getSteamNameReturnsNullWhenNoSteamData() {
            // given
            var game = new CanonicalGame.Builder("Test Game").build();

            // then
            assertNull(game.getSteamName());
        }
    }

    @Nested
    @DisplayName("Builder backward compatibility methods")
    class BuilderBackwardCompatibilityTests {

        @Test
        @DisplayName("setSteamAppId creates Steam data when none exists")
        void setSteamAppIdCreatesNewSteamData() {
            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamAppId(413150)
                    .build();

            // then
            assertNotNull(game.getSteamData());
            assertEquals(413150, game.getSteamData().appId());
            assertNull(game.getSteamData().name());
        }

        @Test
        @DisplayName("setSteamAppId preserves existing name")
        void setSteamAppIdPreservesExistingName() {
            // given
            var steamData = new SteamGameData(null, "Original Name");

            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamData(steamData)
                    .setSteamAppId(413150)
                    .build();

            // then
            assertEquals(413150, game.getSteamData().appId());
            assertEquals("Original Name", game.getSteamData().name());
        }

        @Test
        @DisplayName("setSteamName creates Steam data when none exists")
        void setSteamNameCreatesNewSteamData() {
            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamName("Steam Name")
                    .build();

            // then
            assertNotNull(game.getSteamData());
            assertNull(game.getSteamData().appId());
            assertEquals("Steam Name", game.getSteamData().name());
        }

        @Test
        @DisplayName("setSteamName preserves existing appId")
        void setSteamNamePreservesExistingAppId() {
            // given
            var steamData = new SteamGameData(413150, null);

            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamData(steamData)
                    .setSteamName("New Name")
                    .build();

            // then
            assertEquals(413150, game.getSteamData().appId());
            assertEquals("New Name", game.getSteamData().name());
        }
    }

    @Nested
    @DisplayName("Rating behavior")
    class RatingBehaviorTests {

        @Test
        @DisplayName("returns 0 rating when no Steam rating provided")
        void returnsZeroRatingWhenNoSteamRating() {
            // when
            var game = new CanonicalGame.Builder("Test Game").build();

            // then
            assertEquals(0, game.getRating());
        }

        @Test
        @DisplayName("getRatings returns AggregatedRatings object")
        void getRatingsReturnsAggregatedRatings() {
            // given
            var steamRating = SteamRating.of(85, 15, ReviewSentiment.VERY_POSITIVE);

            // when
            var game = new CanonicalGame.Builder("Test Game")
                    .setSteamRating(steamRating)
                    .build();

            // then
            assertNotNull(game.getRatings());
            assertEquals(steamRating, game.getRatings().steam());
        }
    }
}
