package com.robertforpresent.api.config.legacy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the LegacyGame record and its nested records.
 *
 * <p>Tests focus on the business logic methods: resolvedName() and resolvedAppId()
 * which determine the canonical values from potentially null/blank fields.</p>
 */
class LegacyGameTest {

    @Nested
    @DisplayName("resolvedName()")
    class ResolvedNameTests {

        @Test
        @DisplayName("returns name when name is present")
        void returnsName_whenNameIsPresent() {
            // given
            LegacyGame game = createGameWithIdentity("Stardew Valley", null, null);

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Stardew Valley", resolved);
        }

        @Test
        @DisplayName("returns title when name is null")
        void returnsTitle_whenNameIsNull() {
            // given
            LegacyGame game = createGameWithIdentity(null, "Half-Life 2", null);

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Half-Life 2", resolved);
        }

        @Test
        @DisplayName("returns title when name is blank")
        void returnsTitle_whenNameIsBlank() {
            // given
            LegacyGame game = createGameWithIdentity("   ", "Portal", null);

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Portal", resolved);
        }

        @Test
        @DisplayName("returns foundGameName when name and title are null")
        void returnsFoundGameName_whenNameAndTitleAreNull() {
            // given
            LegacyGame game = createGameWithIdentity(null, null, "The Witcher 3");

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("The Witcher 3", resolved);
        }

        @Test
        @DisplayName("returns foundGameName when name and title are blank")
        void returnsFoundGameName_whenNameAndTitleAreBlank() {
            // given
            LegacyGame game = createGameWithIdentity("", "  ", "Cyberpunk 2077");

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Cyberpunk 2077", resolved);
        }

        @Test
        @DisplayName("returns 'Unknown' when all name fields are null")
        void returnsUnknown_whenAllNamesAreNull() {
            // given
            LegacyGame game = createGameWithIdentity(null, null, null);

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Unknown", resolved);
        }

        @Test
        @DisplayName("returns 'Unknown' when all name fields are blank")
        void returnsUnknown_whenAllNamesAreBlank() {
            // given
            LegacyGame game = createGameWithIdentity("", "  ", "\t\n");

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Unknown", resolved);
        }

        @Test
        @DisplayName("prioritizes name over title and foundGameName")
        void prioritizesName_overTitleAndFoundGameName() {
            // given
            LegacyGame game = createGameWithIdentity("Primary Name", "Title Name", "Found Name");

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Primary Name", resolved);
        }

        @Test
        @DisplayName("prioritizes title over foundGameName")
        void prioritizesTitle_overFoundGameName() {
            // given
            LegacyGame game = createGameWithIdentity(null, "Title Name", "Found Name");

            // when
            String resolved = game.resolvedName();

            // then
            assertEquals("Title Name", resolved);
        }
    }

    @Nested
    @DisplayName("resolvedAppId()")
    class ResolvedAppIdTests {

        @Test
        @DisplayName("returns correctedAppId when present and non-zero")
        void returnsCorrectedAppId_whenPresentAndNonZero() {
            // given
            LegacyGame game = createGameWithAppIds(12345L, 67890L);

            // when
            Long resolved = game.resolvedAppId();

            // then
            assertEquals(67890L, resolved);
        }

        @Test
        @DisplayName("returns appId when correctedAppId is null")
        void returnsAppId_whenCorrectedAppIdIsNull() {
            // given
            LegacyGame game = createGameWithAppIds(12345L, null);

            // when
            Long resolved = game.resolvedAppId();

            // then
            assertEquals(12345L, resolved);
        }

        @Test
        @DisplayName("returns appId when correctedAppId is zero")
        void returnsAppId_whenCorrectedAppIdIsZero() {
            // given
            LegacyGame game = createGameWithAppIds(12345L, 0L);

            // when
            Long resolved = game.resolvedAppId();

            // then
            assertEquals(12345L, resolved);
        }

        @Test
        @DisplayName("returns null when both appId and correctedAppId are null")
        void returnsNull_whenBothAreNull() {
            // given
            LegacyGame game = createGameWithAppIds(null, null);

            // when
            Long resolved = game.resolvedAppId();

            // then
            assertNull(resolved);
        }
    }

    @Nested
    @DisplayName("Record instantiation")
    class RecordInstantiationTests {

        @Test
        @DisplayName("creates valid LegacyGame with all nested records")
        void createsValidLegacyGame_withAllNestedRecords() {
            // given
            LegacyGame.Identity identity = new LegacyGame.Identity(
                    "Test Game", "Test Title", null, "steam",
                    123L, null, null, "hash123", "http://url", "http://thumb"
            );
            LegacyGame.SteamData steamData = new LegacyGame.SteamData(
                    100L, 10L, 110L, 50L, 8L, "Very Positive",
                    0.91f, "icon.jpg", createPlaytime(), "true", "false", "1,2,3"
            );
            LegacyGame.Ratings ratings = new LegacyGame.Ratings(85L, "Test Game", 1.2);
            LegacyGame.UserState userState = new LegacyGame.UserState(true, false, false);

            // when
            LegacyGame game = new LegacyGame(identity, steamData, null, ratings, null, userState);

            // then
            assertNotNull(game);
            assertEquals("Test Game", game.identity().name());
            assertEquals(100L, game.steamData().totalPositive());
            assertEquals(85L, game.ratings().metacriticScore());
            assertTrue(game.userState().played());
        }

        @Test
        @DisplayName("UserState correctly stores boolean flags")
        void userStateCorrectlyStoresBooleanFlags() {
            // given/when
            LegacyGame.UserState played = new LegacyGame.UserState(true, false, false);
            LegacyGame.UserState hidden = new LegacyGame.UserState(false, true, false);
            LegacyGame.UserState later = new LegacyGame.UserState(false, false, true);

            // then
            assertTrue(played.played());
            assertFalse(played.hide());
            assertFalse(played.later());

            assertFalse(hidden.played());
            assertTrue(hidden.hide());
            assertFalse(hidden.later());

            assertFalse(later.played());
            assertFalse(later.hide());
            assertTrue(later.later());
        }

        @Test
        @DisplayName("Playtime record stores all platform-specific times")
        void playtimeRecordStoresAllPlatformSpecificTimes() {
            // given/when
            LegacyGame.Playtime playtime = new LegacyGame.Playtime(
                    100L, 50L, 30L, 15L, 5L, 10L, 0L, 1234567890L
            );

            // then
            assertEquals(100L, playtime.forever());
            assertEquals(50L, playtime.windowsForever());
            assertEquals(30L, playtime.macForever());
            assertEquals(15L, playtime.linuxForever());
            assertEquals(5L, playtime.deckForever());
            assertEquals(10L, playtime.twoWeeks());
        }
    }

    // Helper methods for creating test fixtures

    private LegacyGame createGameWithIdentity(String name, String title, String foundGameName) {
        LegacyGame.Identity identity = new LegacyGame.Identity(
                name, title, foundGameName, "steam",
                null, null, null, null, null, null
        );
        return new LegacyGame(
                identity, null, null,
                new LegacyGame.Ratings(null, null, null),
                null,
                new LegacyGame.UserState(false, false, false)
        );
    }

    private LegacyGame createGameWithAppIds(Long appId, Long correctedAppId) {
        LegacyGame.Identity identity = new LegacyGame.Identity(
                "Test", null, null, "steam",
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
        return new LegacyGame.Playtime(100L, 50L, 30L, 15L, 5L, 10L, 0L, 0L);
    }
}
