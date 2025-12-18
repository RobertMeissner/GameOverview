package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for MetacriticGameData record.
 */
class MetacriticGameDataTest {

    @Nested
    @DisplayName("storeId()")
    class StoreIdTests {

        @Test
        @DisplayName("returns slugified game name when present")
        void returnsSlugifiedGameName_whenPresent() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);

            // when
            var storeId = metacriticData.storeId();

            // then
            assertEquals("stardew-valley", storeId);
        }

        @Test
        @DisplayName("returns null when game name is null")
        void returnsNull_whenGameNameIsNull() {
            // given
            var metacriticData = new MetacriticGameData(89, null, null);

            // when
            var storeId = metacriticData.storeId();

            // then
            assertNull(storeId);
        }

        @Test
        @DisplayName("slugifies complex game names correctly")
        void slugifiesComplexGameNames() {
            // Test special characters removal
            assertEquals("half-life-2",
                    new MetacriticGameData(96, "Half-Life 2", null).storeId());

            // Test apostrophes
            assertEquals("baldurs-gate-3",
                    new MetacriticGameData(96, "Baldur's Gate 3", null).storeId());

            // Test colons
            assertEquals("the-witcher-3-wild-hunt",
                    new MetacriticGameData(93, "The Witcher 3: Wild Hunt", null).storeId());
        }
    }

    @Nested
    @DisplayName("storeName()")
    class StoreNameTests {

        @Test
        @DisplayName("returns game name when present")
        void returnsGameName_whenPresent() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);

            // then
            assertEquals("Stardew Valley", metacriticData.storeName());
        }

        @Test
        @DisplayName("returns null when game name is null")
        void returnsNull_whenGameNameIsNull() {
            // given
            var metacriticData = new MetacriticGameData(89, null, null);

            // then
            assertNull(metacriticData.storeName());
        }
    }

    @Nested
    @DisplayName("storeLink()")
    class StoreLinkTests {

        @Test
        @DisplayName("returns provided link when available")
        void returnsProvidedLink_whenAvailable() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley",
                    "https://www.metacritic.com/game/stardew-valley");

            // when
            var storeLink = metacriticData.storeLink();

            // then
            assertEquals("https://www.metacritic.com/game/stardew-valley", storeLink);
        }

        @Test
        @DisplayName("generates link from game name when link is null")
        void generatesLinkFromGameName_whenLinkIsNull() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);

            // when
            var storeLink = metacriticData.storeLink();

            // then
            assertEquals("https://www.metacritic.com/game/stardew-valley", storeLink);
        }

        @Test
        @DisplayName("returns null when link is blank and game name is null")
        void returnsNull_whenLinkBlankAndGameNameNull() {
            // given
            var metacriticData = new MetacriticGameData(89, null, "   ");

            // when
            var storeLink = metacriticData.storeLink();

            // then
            assertNull(storeLink);
        }

        @Test
        @DisplayName("generates link from game name when link is blank")
        void generatesLinkFromGameName_whenLinkIsBlank() {
            // given
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", "   ");

            // when
            var storeLink = metacriticData.storeLink();

            // then
            assertEquals("https://www.metacritic.com/game/stardew-valley", storeLink);
        }

        @Test
        @DisplayName("returns null when all fields are null")
        void returnsNull_whenAllFieldsNull() {
            // given
            var metacriticData = new MetacriticGameData(null, null, null);

            // then
            assertNull(metacriticData.storeLink());
        }

        @Test
        @DisplayName("generates correct links for various game names")
        void generatesCorrectLinks_forVariousGameNames() {
            assertEquals("https://www.metacritic.com/game/half-life-2",
                    new MetacriticGameData(96, "Half-Life 2", null).storeLink());

            assertEquals("https://www.metacritic.com/game/the-witcher-3-wild-hunt",
                    new MetacriticGameData(93, "The Witcher 3: Wild Hunt", null).storeLink());
        }
    }

    @Nested
    @DisplayName("record accessors")
    class RecordAccessorTests {

        @Test
        @DisplayName("score accessor returns correct value")
        void scoreAccessor() {
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);
            assertEquals(89, metacriticData.score());
        }

        @Test
        @DisplayName("gameName accessor returns correct value")
        void gameNameAccessor() {
            var metacriticData = new MetacriticGameData(89, "Stardew Valley", null);
            assertEquals("Stardew Valley", metacriticData.gameName());
        }

        @Test
        @DisplayName("link accessor returns correct value")
        void linkAccessor() {
            var metacriticData = new MetacriticGameData(89, "Stardew Valley",
                    "https://www.metacritic.com/game/stardew-valley");
            assertEquals("https://www.metacritic.com/game/stardew-valley", metacriticData.link());
        }

        @Test
        @DisplayName("score can be null")
        void scoreCanBeNull() {
            var metacriticData = new MetacriticGameData(null, "Stardew Valley", null);
            assertNull(metacriticData.score());
        }
    }
}
