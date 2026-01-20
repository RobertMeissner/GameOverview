package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for EpicGameData record.
 * This record has complex logic for storeLink() that handles UUID-like IDs from IGDB.
 */
class EpicGameDataTest {

    @Nested
    @DisplayName("Record accessors")
    class AccessorTests {

        @Test
        @DisplayName("epicId() returns the Epic ID")
        void epicIdReturnsTheEpicId() {
            // given
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", null);

            // then
            assertEquals("stardew-valley", epicData.epicId());
        }

        @Test
        @DisplayName("name() returns the name")
        void nameReturnsTheName() {
            // given
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", null);

            // then
            assertEquals("Stardew Valley", epicData.name());
        }

        @Test
        @DisplayName("link() returns the link")
        void linkReturnsTheLink() {
            // given
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", "https://store.epicgames.com/p/stardew-valley");

            // then
            assertEquals("https://store.epicgames.com/p/stardew-valley", epicData.link());
        }
    }

    @Nested
    @DisplayName("storeLink() with valid links")
    class StoreLinkValidTests {

        @Test
        @DisplayName("returns link when link is valid and not UUID-like")
        void returnsLinkWhenValidAndNotUuid() {
            // given
            var epicData = new EpicGameData(null, "Stardew Valley", "https://store.epicgames.com/p/stardew-valley");

            // then
            assertEquals("https://store.epicgames.com/p/stardew-valley", epicData.storeLink());
        }

        @Test
        @DisplayName("returns link with query parameters")
        void returnsLinkWithQueryParameters() {
            // given
            var epicData = new EpicGameData(null, "Test", "https://store.epicgames.com/p/test-game?ref=email");

            // then
            assertEquals("https://store.epicgames.com/p/test-game?ref=email", epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("storeLink() with UUID-like IDs (IGDB bad data)")
    class StoreLinkUuidDetectionTests {

        @Test
        @DisplayName("detects 32-char hex ID as UUID-like")
        void detects32CharHexIdAsUuidLike() {
            // given - This is a UUID without dashes, like from IGDB bad data
            var epicData = new EpicGameData("d4b6a615ea794a6295d34608c5426d4f", "Test Game", null);

            // then - Should not use the UUID-like epicId, falls back to search
            assertEquals("https://store.epicgames.com/browse?q=Test%20Game", epicData.storeLink());
        }

        @Test
        @DisplayName("detects UUID with dashes as UUID-like")
        void detectsUuidWithDashesAsUuidLike() {
            // given
            var epicData = new EpicGameData("d4b6a615-ea79-4a62-95d3-4608c5426d4f", "Test Game", null);

            // then
            assertEquals("https://store.epicgames.com/browse?q=Test%20Game", epicData.storeLink());
        }

        @Test
        @DisplayName("rejects link containing UUID-like ID in path")
        void rejectsLinkContainingUuidLikeIdInPath() {
            // given - Link has UUID-like ID extracted from /p/
            var epicData = new EpicGameData(null, "Test Game", "https://store.epicgames.com/p/d4b6a615ea794a6295d34608c5426d4f");

            // then - Should fall back to search because link ID is UUID-like
            assertEquals("https://store.epicgames.com/browse?q=Test%20Game", epicData.storeLink());
        }

        @Test
        @DisplayName("accepts link with normal slug even if epicId is UUID-like")
        void acceptsLinkWithNormalSlugEvenIfEpicIdIsUuidLike() {
            // given - Link is valid, epicId is UUID-like but link takes precedence
            var epicData = new EpicGameData("d4b6a615ea794a6295d34608c5426d4f", "Test Game", "https://store.epicgames.com/p/valid-game-slug");

            // then
            assertEquals("https://store.epicgames.com/p/valid-game-slug", epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("storeLink() using epicId")
    class StoreLinkFromEpicIdTests {

        @Test
        @DisplayName("uses epicId when link is null and epicId is valid slug")
        void usesEpicIdWhenLinkIsNull() {
            // given
            var epicData = new EpicGameData("stardew-valley", "Stardew Valley", null);

            // then
            assertEquals("https://store.epicgames.com/p/stardew-valley", epicData.storeLink());
        }

        @Test
        @DisplayName("uses epicId with numbers")
        void usesEpicIdWithNumbers() {
            // given
            var epicData = new EpicGameData("game-2077", "Game 2077", null);

            // then
            assertEquals("https://store.epicgames.com/p/game-2077", epicData.storeLink());
        }

        @Test
        @DisplayName("uses epicId with mixed case")
        void usesEpicIdWithMixedCase() {
            // given
            var epicData = new EpicGameData("Game-Title", "Game Title", null);

            // then
            assertEquals("https://store.epicgames.com/p/Game-Title", epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("storeLink() fallback to search")
    class StoreLinkSearchFallbackTests {

        @Test
        @DisplayName("falls back to search when epicId is null and link is null")
        void fallsBackToSearchWhenBothNull() {
            // given
            var epicData = new EpicGameData(null, "Stardew Valley", null);

            // then
            assertEquals("https://store.epicgames.com/browse?q=Stardew%20Valley", epicData.storeLink());
        }

        @Test
        @DisplayName("encodes spaces in search query")
        void encodesSpacesInSearchQuery() {
            // given
            var epicData = new EpicGameData(null, "The Witcher 3", null);

            // then
            assertEquals("https://store.epicgames.com/browse?q=The%20Witcher%203", epicData.storeLink());
        }

        @Test
        @DisplayName("handles multiple spaces in name")
        void handlesMultipleSpacesInName() {
            // given
            var epicData = new EpicGameData(null, "A  Game", null);

            // then
            assertEquals("https://store.epicgames.com/browse?q=A%20%20Game", epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("storeLink() returns null")
    class StoreLinkNullTests {

        @Test
        @DisplayName("returns null when all fields are null")
        void returnsNullWhenAllFieldsNull() {
            // given
            var epicData = new EpicGameData(null, null, null);

            // then
            assertNull(epicData.storeLink());
        }

        @Test
        @DisplayName("returns null when name is blank")
        void returnsNullWhenNameIsBlank() {
            // given
            var epicData = new EpicGameData(null, "   ", null);

            // then
            assertNull(epicData.storeLink());
        }

        @Test
        @DisplayName("returns null when name is empty")
        void returnsNullWhenNameIsEmpty() {
            // given
            var epicData = new EpicGameData(null, "", null);

            // then
            assertNull(epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("Link parsing edge cases")
    class LinkParsingEdgeCaseTests {

        @Test
        @DisplayName("handles link with trailing slash")
        void handlesLinkWithTrailingSlash() {
            // given
            var epicData = new EpicGameData(null, "Test", "https://store.epicgames.com/p/valid-slug/");

            // The implementation extracts ID from /p/, so this should work
            // then
            assertEquals("https://store.epicgames.com/p/valid-slug/", epicData.storeLink());
        }

        @Test
        @DisplayName("handles link with hash fragment")
        void handlesLinkWithHashFragment() {
            // given
            var epicData = new EpicGameData(null, "Test", "https://store.epicgames.com/p/valid-slug#reviews");

            // then
            assertEquals("https://store.epicgames.com/p/valid-slug#reviews", epicData.storeLink());
        }

        @Test
        @DisplayName("handles link without /p/ path falls back to search")
        void handlesLinkWithoutPPath() {
            // given - Link without /p/ can't have ID extracted, so it falls back to search
            var epicData = new EpicGameData(null, "Test", "https://store.epicgames.com/collection/games");

            // then - Falls back to search because no ID can be extracted from the link
            assertEquals("https://store.epicgames.com/browse?q=Test", epicData.storeLink());
        }

        @Test
        @DisplayName("handles short non-UUID epicId")
        void handlesShortNonUuidEpicId() {
            // given - 31 chars is not a UUID
            var epicData = new EpicGameData("abc123def456789012345678901234", "Test", null);

            // then - Should be used as valid epicId (not 32 chars)
            assertEquals("https://store.epicgames.com/p/abc123def456789012345678901234", epicData.storeLink());
        }

        @Test
        @DisplayName("handles lowercase hex that looks like UUID")
        void handlesLowercaseHexUuid() {
            // given - lowercase 32 hex chars
            var epicData = new EpicGameData("abcdef0123456789abcdef0123456789", "Test", null);

            // then - Should be detected as UUID-like
            assertEquals("https://store.epicgames.com/browse?q=Test", epicData.storeLink());
        }

        @Test
        @DisplayName("handles uppercase hex that looks like UUID")
        void handlesUppercaseHexUuid() {
            // given - uppercase 32 hex chars
            var epicData = new EpicGameData("ABCDEF0123456789ABCDEF0123456789", "Test", null);

            // then - Should be detected as UUID-like
            assertEquals("https://store.epicgames.com/browse?q=Test", epicData.storeLink());
        }

        @Test
        @DisplayName("accepts 32-char string with non-hex characters as valid slug")
        void accepts32CharWithNonHexAsValidSlug() {
            // given - 32 chars but contains 'g' which is not hex
            var epicData = new EpicGameData("abcdefg123456789abcdefg12345678", "Test", null);

            // then - Should be used as valid epicId
            assertEquals("https://store.epicgames.com/p/abcdefg123456789abcdefg12345678", epicData.storeLink());
        }
    }

    @Nested
    @DisplayName("Record equality")
    class EqualityTests {

        @Test
        @DisplayName("equal records are equal")
        void equalRecordsAreEqual() {
            // given
            var epic1 = new EpicGameData("slug", "Name", "https://epic.com/p/slug");
            var epic2 = new EpicGameData("slug", "Name", "https://epic.com/p/slug");

            // then
            assertEquals(epic1, epic2);
            assertEquals(epic1.hashCode(), epic2.hashCode());
        }

        @Test
        @DisplayName("different records are not equal")
        void differentRecordsAreNotEqual() {
            // given
            var epic1 = new EpicGameData("slug1", "Name", null);
            var epic2 = new EpicGameData("slug2", "Name", null);

            // then
            assertNotEquals(epic1, epic2);
        }
    }
}
