package com.robertforpresent.api.scraper.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ScrapedGameInfo record (scraper domain).
 */
class ScrapedGameInfoTest {

    @Nested
    @DisplayName("Record construction and accessors")
    class ConstructionTests {

        @Test
        @DisplayName("creates record with all fields")
        void createsRecordWithAllFields() {
            // given
            var storeLinks = List.of(
                    new ScrapedGameInfo.StoreLink("Steam", "https://steam.com/app/413150", "413150")
            );
            var playtime = new ScrapedGameInfo.PlaytimeInfo(52.0, 94.0, 165.0);

            // when
            var info = new ScrapedGameInfo(
                    17000L,
                    "Stardew Valley",
                    "stardew-valley",
                    "A farming simulation RPG",
                    "https://images.igdb.com/cover.jpg",
                    89.0,
                    2016,
                    List.of("Simulation", "RPG"),
                    List.of("PC", "Switch"),
                    storeLinks,
                    playtime,
                    "IGDB"
            );

            // then
            assertEquals(17000L, info.externalId());
            assertEquals("Stardew Valley", info.name());
            assertEquals("stardew-valley", info.slug());
            assertEquals("A farming simulation RPG", info.summary());
            assertEquals("https://images.igdb.com/cover.jpg", info.coverUrl());
            assertEquals(89.0, info.rating());
            assertEquals(2016, info.releaseYear());
            assertEquals(2, info.genres().size());
            assertEquals(2, info.platforms().size());
            assertEquals(1, info.storeLinks().size());
            assertNotNull(info.playtime());
            assertEquals("IGDB", info.source());
        }

        @Test
        @DisplayName("handles null optional fields")
        void handlesNullOptionalFields() {
            // when
            var info = new ScrapedGameInfo(
                    1L,
                    "Test Game",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "IGDB"
            );

            // then
            assertEquals(1L, info.externalId());
            assertEquals("Test Game", info.name());
            assertNull(info.slug());
            assertNull(info.summary());
            assertNull(info.coverUrl());
            assertNull(info.rating());
            assertNull(info.releaseYear());
            assertTrue(info.genres().isEmpty());
            assertTrue(info.platforms().isEmpty());
            assertTrue(info.storeLinks().isEmpty());
            assertNull(info.playtime());
        }
    }

    @Nested
    @DisplayName("Defensive copying")
    class DefensiveCopyTests {

        @Test
        @DisplayName("genres list is immutable copy")
        void genresListIsImmutableCopy() {
            // given
            var mutableGenres = new ArrayList<>(List.of("RPG", "Simulation"));

            // when
            var info = new ScrapedGameInfo(
                    1L, "Test", null, null, null, null, null,
                    mutableGenres, List.of(), List.of(), null, "IGDB"
            );

            // then - modifying original should not affect record
            mutableGenres.add("Action");
            assertEquals(2, info.genres().size());

            // and - returned list should be immutable
            assertThrows(UnsupportedOperationException.class, () ->
                    info.genres().add("Horror")
            );
        }

        @Test
        @DisplayName("platforms list is immutable copy")
        void platformsListIsImmutableCopy() {
            // given
            var mutablePlatforms = new ArrayList<>(List.of("PC", "Switch"));

            // when
            var info = new ScrapedGameInfo(
                    1L, "Test", null, null, null, null, null,
                    List.of(), mutablePlatforms, List.of(), null, "IGDB"
            );

            // then
            mutablePlatforms.add("PS5");
            assertEquals(2, info.platforms().size());

            assertThrows(UnsupportedOperationException.class, () ->
                    info.platforms().add("Xbox")
            );
        }

        @Test
        @DisplayName("storeLinks list is immutable copy")
        void storeLinksListIsImmutableCopy() {
            // given
            var mutableLinks = new ArrayList<>(List.of(
                    new ScrapedGameInfo.StoreLink("Steam", "https://steam.com", "123")
            ));

            // when
            var info = new ScrapedGameInfo(
                    1L, "Test", null, null, null, null, null,
                    List.of(), List.of(), mutableLinks, null, "IGDB"
            );

            // then
            mutableLinks.add(new ScrapedGameInfo.StoreLink("GOG", "https://gog.com", "456"));
            assertEquals(1, info.storeLinks().size());

            assertThrows(UnsupportedOperationException.class, () ->
                    info.storeLinks().add(new ScrapedGameInfo.StoreLink("Epic", "https://epic.com", "789"))
            );
        }
    }

    @Nested
    @DisplayName("StoreLink nested record")
    class StoreLinkTests {

        @Test
        @DisplayName("creates StoreLink with all fields")
        void createsStoreLinkWithAllFields() {
            // when
            var link = new ScrapedGameInfo.StoreLink("Steam", "https://store.steampowered.com/app/413150", "413150");

            // then
            assertEquals("Steam", link.storeName());
            assertEquals("https://store.steampowered.com/app/413150", link.url());
            assertEquals("413150", link.storeId());
        }

        @Test
        @DisplayName("allows null storeId")
        void allowsNullStoreId() {
            // when
            var link = new ScrapedGameInfo.StoreLink("GOG", "https://www.gog.com/game/stardew_valley", null);

            // then
            assertEquals("GOG", link.storeName());
            assertEquals("https://www.gog.com/game/stardew_valley", link.url());
            assertNull(link.storeId());
        }

        @Test
        @DisplayName("equality works correctly")
        void equalityWorksCorrectly() {
            // given
            var link1 = new ScrapedGameInfo.StoreLink("Steam", "https://steam.com", "123");
            var link2 = new ScrapedGameInfo.StoreLink("Steam", "https://steam.com", "123");
            var link3 = new ScrapedGameInfo.StoreLink("GOG", "https://steam.com", "123");

            // then
            assertEquals(link1, link2);
            assertNotEquals(link1, link3);
        }
    }

    @Nested
    @DisplayName("PlaytimeInfo nested record")
    class PlaytimeInfoTests {

        @Test
        @DisplayName("creates PlaytimeInfo with all fields")
        void createsPlaytimeInfoWithAllFields() {
            // when
            var playtime = new ScrapedGameInfo.PlaytimeInfo(52.0, 94.0, 165.0);

            // then
            assertEquals(52.0, playtime.mainStoryHours());
            assertEquals(94.0, playtime.mainPlusExtrasHours());
            assertEquals(165.0, playtime.completionistHours());
        }

        @Test
        @DisplayName("allows null fields")
        void allowsNullFields() {
            // when
            var playtime = new ScrapedGameInfo.PlaytimeInfo(null, null, null);

            // then
            assertNull(playtime.mainStoryHours());
            assertNull(playtime.mainPlusExtrasHours());
            assertNull(playtime.completionistHours());
        }

        @Test
        @DisplayName("handles partial data")
        void handlesPartialData() {
            // when
            var playtime = new ScrapedGameInfo.PlaytimeInfo(10.0, null, 30.0);

            // then
            assertEquals(10.0, playtime.mainStoryHours());
            assertNull(playtime.mainPlusExtrasHours());
            assertEquals(30.0, playtime.completionistHours());
        }

        @Test
        @DisplayName("equality works correctly")
        void equalityWorksCorrectly() {
            // given
            var pt1 = new ScrapedGameInfo.PlaytimeInfo(10.0, 20.0, 30.0);
            var pt2 = new ScrapedGameInfo.PlaytimeInfo(10.0, 20.0, 30.0);
            var pt3 = new ScrapedGameInfo.PlaytimeInfo(15.0, 20.0, 30.0);

            // then
            assertEquals(pt1, pt2);
            assertNotEquals(pt1, pt3);
        }
    }

    @Nested
    @DisplayName("Real-world game data scenarios")
    class RealWorldScenariosTests {

        @Test
        @DisplayName("handles indie game from IGDB")
        void handlesIndieGameFromIgdb() {
            // given
            var storeLinks = List.of(
                    new ScrapedGameInfo.StoreLink("Steam", "https://store.steampowered.com/app/413150", "413150"),
                    new ScrapedGameInfo.StoreLink("GOG", "https://www.gog.com/game/stardew_valley", null)
            );
            var playtime = new ScrapedGameInfo.PlaytimeInfo(52.0, 94.0, 165.0);

            // when
            var info = new ScrapedGameInfo(
                    17000L,
                    "Stardew Valley",
                    "stardew-valley",
                    "Stardew Valley is an open-ended country-life RPG!",
                    "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
                    89.5,
                    2016,
                    List.of("Simulator", "Role-playing (RPG)", "Indie"),
                    List.of("PC (Microsoft Windows)", "Mac", "Linux", "Nintendo Switch"),
                    storeLinks,
                    playtime,
                    "IGDB"
            );

            // then
            assertEquals(17000L, info.externalId());
            assertEquals("stardew-valley", info.slug());
            assertTrue(info.genres().contains("Indie"));
            assertTrue(info.platforms().contains("Nintendo Switch"));
            assertEquals(2, info.storeLinks().size());
            assertEquals(52.0, info.playtime().mainStoryHours());
        }

        @Test
        @DisplayName("handles AAA game with multiple store links")
        void handlesAaaGameWithMultipleStoreLinks() {
            // given
            var storeLinks = List.of(
                    new ScrapedGameInfo.StoreLink("Steam", "https://store.steampowered.com/app/1245620", "1245620"),
                    new ScrapedGameInfo.StoreLink("Epic Games", "https://store.epicgames.com/p/elden-ring", "elden-ring"),
                    new ScrapedGameInfo.StoreLink("PlayStation Store", "https://store.playstation.com/...", null),
                    new ScrapedGameInfo.StoreLink("Xbox Store", "https://www.xbox.com/...", null)
            );

            // when
            var info = new ScrapedGameInfo(
                    119133L,
                    "ELDEN RING",
                    "elden-ring",
                    "THE NEW FANTASY ACTION RPG",
                    "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
                    96.0,
                    2022,
                    List.of("Role-playing (RPG)", "Adventure"),
                    List.of("PC (Microsoft Windows)", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X|S"),
                    storeLinks,
                    new ScrapedGameInfo.PlaytimeInfo(55.0, 98.0, 132.0),
                    "IGDB"
            );

            // then
            assertEquals(4, info.storeLinks().size());
            assertEquals("1245620", info.storeLinks().get(0).storeId());
            assertEquals("elden-ring", info.storeLinks().get(1).storeId());
        }

        @Test
        @DisplayName("handles game without playtime data")
        void handlesGameWithoutPlaytimeData() {
            // when
            var info = new ScrapedGameInfo(
                    999L,
                    "New Release",
                    "new-release",
                    "A brand new game",
                    "https://images.igdb.com/cover.jpg",
                    null,  // no rating yet
                    2024,
                    List.of("Action"),
                    List.of("PC"),
                    List.of(),  // no store links yet
                    null,  // no playtime data
                    "IGDB"
            );

            // then
            assertNull(info.rating());
            assertNull(info.playtime());
            assertTrue(info.storeLinks().isEmpty());
        }
    }

    @Nested
    @DisplayName("Record equality")
    class EqualityTests {

        @Test
        @DisplayName("equal records are equal")
        void equalRecordsAreEqual() {
            // given
            var info1 = new ScrapedGameInfo(
                    1L, "Game", "game", null, null, null, null,
                    List.of("RPG"), List.of("PC"), List.of(), null, "IGDB"
            );
            var info2 = new ScrapedGameInfo(
                    1L, "Game", "game", null, null, null, null,
                    List.of("RPG"), List.of("PC"), List.of(), null, "IGDB"
            );

            // then
            assertEquals(info1, info2);
            assertEquals(info1.hashCode(), info2.hashCode());
        }

        @Test
        @DisplayName("different external IDs make records unequal")
        void differentExternalIdsMakeRecordsUnequal() {
            // given
            var info1 = new ScrapedGameInfo(
                    1L, "Game", "game", null, null, null, null,
                    List.of(), List.of(), List.of(), null, "IGDB"
            );
            var info2 = new ScrapedGameInfo(
                    2L, "Game", "game", null, null, null, null,
                    List.of(), List.of(), List.of(), null, "IGDB"
            );

            // then
            assertNotEquals(info1, info2);
        }
    }
}
