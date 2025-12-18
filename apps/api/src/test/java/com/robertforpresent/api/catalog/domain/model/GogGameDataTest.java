package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for GogGameData record.
 */
class GogGameDataTest {

    @Nested
    @DisplayName("storeId()")
    class StoreIdTests {

        @Test
        @DisplayName("returns GOG ID as string when present")
        void returnsGogIdAsString_whenPresent() {
            // given
            var gogData = new GogGameData(1453375253L, "Stardew Valley", null);

            // when
            var storeId = gogData.storeId();

            // then
            assertEquals("1453375253", storeId);
        }

        @Test
        @DisplayName("returns null when GOG ID is null")
        void returnsNull_whenGogIdIsNull() {
            // given
            var gogData = new GogGameData(null, "Stardew Valley", null);

            // when
            var storeId = gogData.storeId();

            // then
            assertNull(storeId);
        }
    }

    @Nested
    @DisplayName("storeName()")
    class StoreNameTests {

        @Test
        @DisplayName("returns name when present")
        void returnsName_whenPresent() {
            // given
            var gogData = new GogGameData(1453375253L, "Stardew Valley", null);

            // then
            assertEquals("Stardew Valley", gogData.storeName());
        }

        @Test
        @DisplayName("returns null when name is null")
        void returnsNull_whenNameIsNull() {
            // given
            var gogData = new GogGameData(1453375253L, null, null);

            // then
            assertNull(gogData.storeName());
        }
    }

    @Nested
    @DisplayName("storeLink()")
    class StoreLinkTests {

        @Test
        @DisplayName("returns provided link when available")
        void returnsProvidedLink_whenAvailable() {
            // given
            var gogData = new GogGameData(1453375253L, "Stardew Valley",
                    "https://www.gog.com/game/stardew_valley");

            // when
            var storeLink = gogData.storeLink();

            // then
            assertEquals("https://www.gog.com/game/stardew_valley", storeLink);
        }

        @Test
        @DisplayName("returns null when link is null and ID present")
        void returnsNull_whenLinkIsNullAndIdPresent() {
            // given - GOG links use slugified names, not IDs, so we can't construct them
            var gogData = new GogGameData(1453375253L, "Stardew Valley", null);

            // when
            var storeLink = gogData.storeLink();

            // then
            assertNull(storeLink);
        }

        @Test
        @DisplayName("returns null when link is blank")
        void returnsNull_whenLinkIsBlank() {
            // given
            var gogData = new GogGameData(1453375253L, "Stardew Valley", "   ");

            // when
            var storeLink = gogData.storeLink();

            // then
            assertNull(storeLink);
        }

        @Test
        @DisplayName("returns null when all fields are null")
        void returnsNull_whenAllFieldsNull() {
            // given
            var gogData = new GogGameData(null, null, null);

            // then
            assertNull(gogData.storeLink());
        }
    }

    @Nested
    @DisplayName("record accessors")
    class RecordAccessorTests {

        @Test
        @DisplayName("gogId accessor returns correct value")
        void gogIdAccessor() {
            var gogData = new GogGameData(1453375253L, "Stardew Valley", null);
            assertEquals(1453375253L, gogData.gogId());
        }

        @Test
        @DisplayName("name accessor returns correct value")
        void nameAccessor() {
            var gogData = new GogGameData(1453375253L, "Stardew Valley", null);
            assertEquals("Stardew Valley", gogData.name());
        }

        @Test
        @DisplayName("link accessor returns correct value")
        void linkAccessor() {
            var gogData = new GogGameData(1453375253L, "Stardew Valley",
                    "https://www.gog.com/game/stardew_valley");
            assertEquals("https://www.gog.com/game/stardew_valley", gogData.link());
        }
    }
}
