package com.robertforpresent.api.collection.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PersonalizedGame domain model.
 */
class PersonalizedGameTest {

    private static final UUID GAMER_ID = UUID.randomUUID();
    private static final UUID CANONICAL_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Builder invariants")
    class BuilderInvariantTests {

        @Test
        @DisplayName("throws when gamerId is null")
        void throwsWhenGamerIdIsNull() {
            // when/then
            assertThrows(IllegalStateException.class, () ->
                    new PersonalizedGame.Builder()
                            .setCanonicalId(CANONICAL_ID)
                            .build()
            );
        }

        @Test
        @DisplayName("throws when canonicalId is null")
        void throwsWhenCanonicalIdIsNull() {
            // when/then
            assertThrows(IllegalStateException.class, () ->
                    new PersonalizedGame.Builder()
                            .setGamerId(GAMER_ID)
                            .build()
            );
        }

        @Test
        @DisplayName("throws when both ids are null")
        void throwsWhenBothIdsAreNull() {
            // when/then
            assertThrows(IllegalStateException.class, () ->
                    new PersonalizedGame.Builder().build()
            );
        }

        @Test
        @DisplayName("builds successfully with both required ids")
        void buildsWithBothRequiredIds() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .build();

            // then
            assertEquals(GAMER_ID, game.getGamerId());
            assertEquals(CANONICAL_ID, game.getCanonicalGameId());
        }
    }

    @Nested
    @DisplayName("Builder defaults")
    class BuilderDefaultTests {

        @Test
        @DisplayName("flags default to false")
        void flagsDefaultToFalse() {
            // when
            var game = createDefaultGame();

            // then
            assertFalse(game.isMarkedAsPlayed());
            assertFalse(game.isMarkedAsHidden());
            assertFalse(game.isMarkedForLater());
        }

        @Test
        @DisplayName("store ownership defaults to false")
        void storeOwnershipDefaultsToFalse() {
            // when
            var game = createDefaultGame();

            // then
            assertFalse(game.isOwnedOnSteam());
            assertFalse(game.isOwnedOnGog());
            assertFalse(game.isOwnedOnEpic());
            assertFalse(game.isOwnedOnXbox());
            assertFalse(game.isOwnedOnPlayStation());
        }

        @Test
        @DisplayName("steam playtime defaults to null")
        void steamPlaytimeDefaultsToNull() {
            // when
            var game = createDefaultGame();

            // then
            assertNull(game.getSteamPlaytimeMinutes());
        }

        @Test
        @DisplayName("other stores defaults to null")
        void otherStoresDefaultsToNull() {
            // when
            var game = createDefaultGame();

            // then
            assertNull(game.getOtherStores());
        }
    }

    @Nested
    @DisplayName("Builder with all flags")
    class BuilderFlagTests {

        @Test
        @DisplayName("sets markedAsPlayed flag")
        void setsMarkedAsPlayedFlag() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsPlayed(true)
                    .build();

            // then
            assertTrue(game.isMarkedAsPlayed());
        }

        @Test
        @DisplayName("sets markedAsHidden flag")
        void setsMarkedAsHiddenFlag() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsHidden(true)
                    .build();

            // then
            assertTrue(game.isMarkedAsHidden());
        }

        @Test
        @DisplayName("sets markedForLater flag")
        void setsMarkedForLaterFlag() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsForLater(true)
                    .build();

            // then
            assertTrue(game.isMarkedForLater());
        }

        @Test
        @DisplayName("sets all flags at once")
        void setsAllFlagsAtOnce() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsPlayed(true)
                    .setMarkAsHidden(true)
                    .setMarkAsForLater(true)
                    .build();

            // then
            assertTrue(game.isMarkedAsPlayed());
            assertTrue(game.isMarkedAsHidden());
            assertTrue(game.isMarkedForLater());
        }
    }

    @Nested
    @DisplayName("Builder with store ownership")
    class BuilderStoreOwnershipTests {

        @Test
        @DisplayName("sets Steam ownership")
        void setsSteamOwnership() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnSteam(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnSteam());
        }

        @Test
        @DisplayName("sets GOG ownership")
        void setsGogOwnership() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnGog(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnGog());
        }

        @Test
        @DisplayName("sets Epic ownership")
        void setsEpicOwnership() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnEpic(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnEpic());
        }

        @Test
        @DisplayName("sets Xbox ownership")
        void setsXboxOwnership() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnXbox(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnXbox());
        }

        @Test
        @DisplayName("sets PlayStation ownership")
        void setsPlayStationOwnership() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnPlayStation(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnPlayStation());
        }

        @Test
        @DisplayName("sets multiple store ownerships")
        void setsMultipleStoreOwnerships() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOwnedOnSteam(true)
                    .setOwnedOnGog(true)
                    .setOwnedOnEpic(true)
                    .build();

            // then
            assertTrue(game.isOwnedOnSteam());
            assertTrue(game.isOwnedOnGog());
            assertTrue(game.isOwnedOnEpic());
            assertFalse(game.isOwnedOnXbox());
            assertFalse(game.isOwnedOnPlayStation());
        }

        @Test
        @DisplayName("sets other stores string")
        void setsOtherStores() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setOtherStores("Humble Bundle,itch.io")
                    .build();

            // then
            assertEquals("Humble Bundle,itch.io", game.getOtherStores());
        }
    }

    @Nested
    @DisplayName("Builder with playtime")
    class BuilderPlaytimeTests {

        @Test
        @DisplayName("sets Steam playtime in minutes")
        void setsSteamPlaytimeMinutes() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setSteamPlaytimeMinutes(1250)
                    .build();

            // then
            assertEquals(1250, game.getSteamPlaytimeMinutes());
        }

        @Test
        @DisplayName("handles zero playtime")
        void handlesZeroPlaytime() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setSteamPlaytimeMinutes(0)
                    .build();

            // then
            assertEquals(0, game.getSteamPlaytimeMinutes());
        }
    }

    @Nested
    @DisplayName("Setters (mutability)")
    class SetterTests {

        @Test
        @DisplayName("setMarkedAsPlayed updates flag")
        void setMarkedAsPlayedUpdatesFlag() {
            // given
            var game = createDefaultGame();
            assertFalse(game.isMarkedAsPlayed());

            // when
            game.setMarkedAsPlayed(true);

            // then
            assertTrue(game.isMarkedAsPlayed());
        }

        @Test
        @DisplayName("setMarkedAsHidden updates flag")
        void setMarkedAsHiddenUpdatesFlag() {
            // given
            var game = createDefaultGame();
            assertFalse(game.isMarkedAsHidden());

            // when
            game.setMarkedAsHidden(true);

            // then
            assertTrue(game.isMarkedAsHidden());
        }

        @Test
        @DisplayName("setMarkedForLater updates flag")
        void setMarkedForLaterUpdatesFlag() {
            // given
            var game = createDefaultGame();
            assertFalse(game.isMarkedForLater());

            // when
            game.setMarkedForLater(true);

            // then
            assertTrue(game.isMarkedForLater());
        }

        @Test
        @DisplayName("setSteamPlaytimeMinutes updates playtime")
        void setSteamPlaytimeMinutesUpdatesPlaytime() {
            // given
            var game = createDefaultGame();
            assertNull(game.getSteamPlaytimeMinutes());

            // when
            game.setSteamPlaytimeMinutes(500);

            // then
            assertEquals(500, game.getSteamPlaytimeMinutes());
        }

        @Test
        @DisplayName("store ownership setters work correctly")
        void storeOwnershipSettersWork() {
            // given
            var game = createDefaultGame();

            // when
            game.setOwnedOnSteam(true);
            game.setOwnedOnGog(true);
            game.setOwnedOnEpic(true);
            game.setOwnedOnXbox(true);
            game.setOwnedOnPlayStation(true);
            game.setOtherStores("Nintendo eShop");

            // then
            assertTrue(game.isOwnedOnSteam());
            assertTrue(game.isOwnedOnGog());
            assertTrue(game.isOwnedOnEpic());
            assertTrue(game.isOwnedOnXbox());
            assertTrue(game.isOwnedOnPlayStation());
            assertEquals("Nintendo eShop", game.getOtherStores());
        }

        @Test
        @DisplayName("flags can be toggled back to false")
        void flagsCanBeToggledBackToFalse() {
            // given
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsPlayed(true)
                    .build();
            assertTrue(game.isMarkedAsPlayed());

            // when
            game.setMarkedAsPlayed(false);

            // then
            assertFalse(game.isMarkedAsPlayed());
        }
    }

    @Nested
    @DisplayName("Complete game scenarios")
    class CompleteGameScenarioTests {

        @Test
        @DisplayName("builds complete personalized game")
        void buildsCompletePersonalizedGame() {
            // when
            var game = new PersonalizedGame.Builder()
                    .setGamerId(GAMER_ID)
                    .setCanonicalId(CANONICAL_ID)
                    .setMarkAsPlayed(false)
                    .setMarkAsHidden(false)
                    .setMarkAsForLater(true)
                    .setSteamPlaytimeMinutes(120)
                    .setOwnedOnSteam(true)
                    .setOwnedOnGog(true)
                    .setOwnedOnEpic(false)
                    .setOwnedOnXbox(false)
                    .setOwnedOnPlayStation(false)
                    .setOtherStores("Humble Bundle")
                    .build();

            // then
            assertEquals(GAMER_ID, game.getGamerId());
            assertEquals(CANONICAL_ID, game.getCanonicalGameId());
            assertFalse(game.isMarkedAsPlayed());
            assertFalse(game.isMarkedAsHidden());
            assertTrue(game.isMarkedForLater());
            assertEquals(120, game.getSteamPlaytimeMinutes());
            assertTrue(game.isOwnedOnSteam());
            assertTrue(game.isOwnedOnGog());
            assertFalse(game.isOwnedOnEpic());
            assertEquals("Humble Bundle", game.getOtherStores());
        }
    }

    // Helper method
    private PersonalizedGame createDefaultGame() {
        return new PersonalizedGame.Builder()
                .setGamerId(GAMER_ID)
                .setCanonicalId(CANONICAL_ID)
                .build();
    }
}
