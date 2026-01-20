package com.robertforpresent.api.catalog.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HltbGameData record (HowLongToBeat data).
 */
class HltbGameDataTest {

    @Nested
    @DisplayName("Record accessors")
    class AccessorTests {

        @Test
        @DisplayName("hltbId() returns the HLTB ID")
        void hltbIdReturnsId() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals(42, hltbData.hltbId());
        }

        @Test
        @DisplayName("gameName() returns the game name")
        void gameNameReturnsName() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals("Stardew Valley", hltbData.gameName());
        }

        @Test
        @DisplayName("mainStoryHours() returns main story time")
        void mainStoryHoursReturnsMainStoryTime() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals(52.0, hltbData.mainStoryHours());
        }

        @Test
        @DisplayName("mainExtraHours() returns main + extras time")
        void mainExtraHoursReturnsMainExtraTime() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals(94.0, hltbData.mainExtraHours());
        }

        @Test
        @DisplayName("completionistHours() returns completionist time")
        void completionistHoursReturnsCompletionistTime() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals(165.0, hltbData.completionistHours());
        }
    }

    @Nested
    @DisplayName("storeLink()")
    class StoreLinkTests {

        @Test
        @DisplayName("returns HLTB URL when hltbId is present")
        void returnsHltbUrlWhenIdPresent() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals("https://howlongtobeat.com/game/42", hltbData.storeLink());
        }

        @Test
        @DisplayName("returns null when hltbId is null")
        void returnsNullWhenIdIsNull() {
            // given
            var hltbData = new HltbGameData(null, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertNull(hltbData.storeLink());
        }

        @Test
        @DisplayName("handles different HLTB IDs")
        void handlesDifferentHltbIds() {
            // given
            var hltbData1 = new HltbGameData(1, "Game 1", 10.0, 20.0, 30.0);
            var hltbData2 = new HltbGameData(99999, "Game 2", 10.0, 20.0, 30.0);

            // then
            assertEquals("https://howlongtobeat.com/game/1", hltbData1.storeLink());
            assertEquals("https://howlongtobeat.com/game/99999", hltbData2.storeLink());
        }
    }

    @Nested
    @DisplayName("getPrimaryPlaytime()")
    class PrimaryPlaytimeTests {

        @Test
        @DisplayName("returns mainStoryHours as primary playtime")
        void returnsMainStoryHoursAsPrimaryPlaytime() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", 52.0, 94.0, 165.0);

            // then
            assertEquals(52.0, hltbData.getPrimaryPlaytime());
        }

        @Test
        @DisplayName("returns null when mainStoryHours is null")
        void returnsNullWhenMainStoryHoursIsNull() {
            // given
            var hltbData = new HltbGameData(42, "Stardew Valley", null, 94.0, 165.0);

            // then
            assertNull(hltbData.getPrimaryPlaytime());
        }

        @Test
        @DisplayName("handles zero playtime")
        void handlesZeroPlaytime() {
            // given
            var hltbData = new HltbGameData(42, "Short Game", 0.0, 0.5, 1.0);

            // then
            assertEquals(0.0, hltbData.getPrimaryPlaytime());
        }

        @Test
        @DisplayName("handles fractional hours")
        void handlesFractionalHours() {
            // given
            var hltbData = new HltbGameData(42, "Short Game", 2.5, 4.5, 8.5);

            // then
            assertEquals(2.5, hltbData.getPrimaryPlaytime());
        }
    }

    @Nested
    @DisplayName("Typical game data scenarios")
    class GameDataScenariosTests {

        @Test
        @DisplayName("handles short game data")
        void handlesShortGameData() {
            // given - Portal is a short game
            var hltbData = new HltbGameData(1000, "Portal", 3.0, 5.0, 9.0);

            // then
            assertEquals(3.0, hltbData.mainStoryHours());
            assertEquals(5.0, hltbData.mainExtraHours());
            assertEquals(9.0, hltbData.completionistHours());
        }

        @Test
        @DisplayName("handles long RPG data")
        void handlesLongRpgData() {
            // given - Long RPG
            var hltbData = new HltbGameData(2000, "The Witcher 3", 52.0, 105.0, 173.0);

            // then
            assertEquals(52.0, hltbData.mainStoryHours());
            assertEquals(105.0, hltbData.mainExtraHours());
            assertEquals(173.0, hltbData.completionistHours());
        }

        @Test
        @DisplayName("handles sandbox game with only main extra time")
        void handlesSandboxGame() {
            // given - Some games don't have clear story lengths
            var hltbData = new HltbGameData(3000, "Minecraft", null, 100.0, null);

            // then
            assertNull(hltbData.mainStoryHours());
            assertEquals(100.0, hltbData.mainExtraHours());
            assertNull(hltbData.completionistHours());
        }
    }

    @Nested
    @DisplayName("Null handling")
    class NullHandlingTests {

        @Test
        @DisplayName("allows all null playtimes")
        void allowsAllNullPlaytimes() {
            // given
            var hltbData = new HltbGameData(42, "Game", null, null, null);

            // then
            assertNull(hltbData.mainStoryHours());
            assertNull(hltbData.mainExtraHours());
            assertNull(hltbData.completionistHours());
        }

        @Test
        @DisplayName("allows null gameName")
        void allowsNullGameName() {
            // given
            var hltbData = new HltbGameData(42, null, 10.0, 20.0, 30.0);

            // then
            assertNull(hltbData.gameName());
        }

        @Test
        @DisplayName("allows all fields null except still works")
        void allowsAllFieldsNull() {
            // given
            var hltbData = new HltbGameData(null, null, null, null, null);

            // then
            assertNull(hltbData.hltbId());
            assertNull(hltbData.gameName());
            assertNull(hltbData.mainStoryHours());
            assertNull(hltbData.mainExtraHours());
            assertNull(hltbData.completionistHours());
            assertNull(hltbData.storeLink());
            assertNull(hltbData.getPrimaryPlaytime());
        }
    }

    @Nested
    @DisplayName("Record equality")
    class EqualityTests {

        @Test
        @DisplayName("equal records are equal")
        void equalRecordsAreEqual() {
            // given
            var hltb1 = new HltbGameData(42, "Game", 10.0, 20.0, 30.0);
            var hltb2 = new HltbGameData(42, "Game", 10.0, 20.0, 30.0);

            // then
            assertEquals(hltb1, hltb2);
            assertEquals(hltb1.hashCode(), hltb2.hashCode());
        }

        @Test
        @DisplayName("different IDs make records unequal")
        void differentIdsMakeRecordsUnequal() {
            // given
            var hltb1 = new HltbGameData(42, "Game", 10.0, 20.0, 30.0);
            var hltb2 = new HltbGameData(43, "Game", 10.0, 20.0, 30.0);

            // then
            assertNotEquals(hltb1, hltb2);
        }

        @Test
        @DisplayName("different playtimes make records unequal")
        void differentPlaytimesMakeRecordsUnequal() {
            // given
            var hltb1 = new HltbGameData(42, "Game", 10.0, 20.0, 30.0);
            var hltb2 = new HltbGameData(42, "Game", 15.0, 20.0, 30.0);

            // then
            assertNotEquals(hltb1, hltb2);
        }
    }
}
