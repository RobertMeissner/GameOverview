package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SteamGameData record.
 */
class SteamGameDataTest {

    @Nested
    @DisplayName("storeId()")
    class StoreIdTests {

        @Test
        @DisplayName("returns app ID as string when present")
        void returnsAppIdAsString_whenPresent() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley");

            // when
            var storeId = steamData.storeId();

            // then
            assertEquals("413150", storeId);
        }

        @Test
        @DisplayName("returns null when app ID is null")
        void returnsNull_whenAppIdIsNull() {
            // given
            var steamData = new SteamGameData(null, "Stardew Valley");

            // when
            var storeId = steamData.storeId();

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
            var steamData = new SteamGameData(413150, "Stardew Valley");

            // then
            assertEquals("Stardew Valley", steamData.storeName());
        }

        @Test
        @DisplayName("returns null when name is null")
        void returnsNull_whenNameIsNull() {
            // given
            var steamData = new SteamGameData(413150, null);

            // then
            assertNull(steamData.storeName());
        }
    }

    @Nested
    @DisplayName("storeLink()")
    class StoreLinkTests {

        @Test
        @DisplayName("generates Steam store URL when app ID is present")
        void generatesStoreUrl_whenAppIdPresent() {
            // given
            var steamData = new SteamGameData(413150, "Stardew Valley");

            // when
            var storeLink = steamData.storeLink();

            // then
            assertEquals("https://store.steampowered.com/app/413150", storeLink);
        }

        @Test
        @DisplayName("returns null when app ID is null")
        void returnsNull_whenAppIdIsNull() {
            // given
            var steamData = new SteamGameData(null, "Stardew Valley");

            // when
            var storeLink = steamData.storeLink();

            // then
            assertNull(storeLink);
        }

        @Test
        @DisplayName("generates correct URL for different app IDs")
        void generatesCorrectUrl_forDifferentAppIds() {
            // Half-Life 2
            assertEquals("https://store.steampowered.com/app/220",
                    new SteamGameData(220, "Half-Life 2").storeLink());

            // Portal 2
            assertEquals("https://store.steampowered.com/app/620",
                    new SteamGameData(620, "Portal 2").storeLink());
        }
    }

    @Nested
    @DisplayName("record accessors")
    class RecordAccessorTests {

        @Test
        @DisplayName("appId accessor returns correct value")
        void appIdAccessor() {
            var steamData = new SteamGameData(413150, "Stardew Valley");
            assertEquals(413150, steamData.appId());
        }

        @Test
        @DisplayName("name accessor returns correct value")
        void nameAccessor() {
            var steamData = new SteamGameData(413150, "Stardew Valley");
            assertEquals("Stardew Valley", steamData.name());
        }
    }
}
