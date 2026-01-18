package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.robertforpresent.api.scraper.infrastructure.hltb.dto.HltbSearchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HltbApiClient matching logic.
 */
class HltbApiClientTest {

    private HltbApiClient apiClient;

    @BeforeEach
    void setUp() {
        apiClient = new HltbApiClient();
    }

    @Nested
    @DisplayName("findBestMatch()")
    class FindBestMatchTests {

        @Test
        @DisplayName("returns empty when search results are null")
        void returnsEmpty_whenResultsNull() {
            var response = new HltbSearchResponse(null);

            var result = apiClient.findBestMatch(response, "Test Game");

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns empty when search results are empty")
        void returnsEmpty_whenResultsEmpty() {
            var response = new HltbSearchResponse(List.of());

            var result = apiClient.findBestMatch(response, "Test Game");

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("returns exact match when found")
        void returnsExactMatch_whenFound() {
            var game1 = createHltbGame(1, "Stardew Valley", 30, 60, 100);
            var game2 = createHltbGame(2, "Other Game", 20, 40, 80);
            var response = new HltbSearchResponse(List.of(game2, game1));

            var result = apiClient.findBestMatch(response, "Stardew Valley");

            assertTrue(result.isPresent());
            assertEquals("Stardew Valley", result.get().gameName());
        }

        @Test
        @DisplayName("returns exact match case-insensitive")
        void returnsExactMatch_caseInsensitive() {
            var game = createHltbGame(1, "Stardew Valley", 30, 60, 100);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "STARDEW VALLEY");

            assertTrue(result.isPresent());
            assertEquals("Stardew Valley", result.get().gameName());
        }

        @Test
        @DisplayName("matches game when search term contains game name")
        void matchesGame_whenSearchContainsGameName() {
            var game = createHltbGame(1, "Hades", 25, 50, 90);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Hades Game");

            assertTrue(result.isPresent());
            assertEquals("Hades", result.get().gameName());
        }

        @Test
        @DisplayName("matches game when game name contains search term")
        void matchesGame_whenGameNameContainsSearchTerm() {
            var game = createHltbGame(1, "The Witcher 3: Wild Hunt", 50, 100, 180);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Witcher 3");

            assertTrue(result.isPresent());
            assertEquals("The Witcher 3: Wild Hunt", result.get().gameName());
        }

        @Test
        @DisplayName("finds best match using similarity when no exact match")
        void findsBestMatch_usingSimilarity() {
            var game1 = createHltbGame(1, "Dark Souls III", 40, 70, 110);
            var game2 = createHltbGame(2, "Dark Souls", 35, 60, 100);
            var game3 = createHltbGame(3, "Unrelated Game", 10, 20, 30);
            var response = new HltbSearchResponse(List.of(game1, game2, game3));

            var result = apiClient.findBestMatch(response, "Dark Souls 3");

            assertTrue(result.isPresent());
            // Should match "Dark Souls III" since it's more similar
            assertEquals("Dark Souls III", result.get().gameName());
        }

        @Test
        @DisplayName("handles special characters in game names")
        void handlesSpecialCharacters() {
            var game = createHltbGame(1, "NieR:Automata", 25, 45, 65);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Nier Automata");

            assertTrue(result.isPresent());
            assertEquals("NieR:Automata", result.get().gameName());
        }

        @Test
        @DisplayName("falls back to first result when low similarity")
        void fallsBackToFirstResult_whenLowSimilarity() {
            var game = createHltbGame(1, "Completely Different Name", 30, 50, 80);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "XYZABC Game");

            // Should still return first result as fallback
            assertTrue(result.isPresent());
            assertEquals("Completely Different Name", result.get().gameName());
        }

        @Test
        @DisplayName("prefers higher similarity over order in results")
        void prefersHigherSimilarity_overOrder() {
            var game1 = createHltbGame(1, "Some Random Game", 10, 20, 30);
            var game2 = createHltbGame(2, "Celeste", 8, 15, 25);
            var response = new HltbSearchResponse(List.of(game1, game2));

            var result = apiClient.findBestMatch(response, "Celeste");

            assertTrue(result.isPresent());
            assertEquals("Celeste", result.get().gameName());
        }

        @Test
        @DisplayName("handles numbered sequels correctly")
        void handlesNumberedSequels() {
            var game1 = createHltbGame(1, "Portal", 3, 5, 8);
            var game2 = createHltbGame(2, "Portal 2", 8, 12, 20);
            var response = new HltbSearchResponse(List.of(game1, game2));

            var result = apiClient.findBestMatch(response, "Portal 2");

            assertTrue(result.isPresent());
            assertEquals("Portal 2", result.get().gameName());
        }
    }

    @Nested
    @DisplayName("HltbGame playtime conversion")
    class PlaytimeConversionTests {

        @Test
        @DisplayName("converts seconds to hours for main story")
        void convertsSecondsToHours_mainStory() {
            // 3600 seconds = 1 hour, stored as 3600 in comp_main
            var game = createHltbGame(1, "Test", 3600, 0, 0);

            assertEquals(1.0, game.mainStoryHours(), 0.01);
        }

        @Test
        @DisplayName("converts seconds to hours for main+extra")
        void convertsSecondsToHours_mainExtra() {
            // 7200 seconds = 2 hours
            var game = createHltbGame(1, "Test", 0, 7200, 0);

            assertEquals(2.0, game.mainExtraHours(), 0.01);
        }

        @Test
        @DisplayName("converts seconds to hours for completionist")
        void convertsSecondsToHours_completionist() {
            // 18000 seconds = 5 hours
            var game = createHltbGame(1, "Test", 0, 0, 18000);

            assertEquals(5.0, game.completionistHours(), 0.01);
        }

        @Test
        @DisplayName("returns 0 for zero time values")
        void returnsZero_forZeroTimeValues() {
            var game = createHltbGame(1, "Test", 0, 0, 0);

            assertEquals(0.0, game.mainStoryHours());
            assertEquals(0.0, game.mainExtraHours());
            assertEquals(0.0, game.completionistHours());
        }
    }

    /**
     * Helper method to create an HltbGame record for testing.
     */
    private HltbSearchResponse.HltbGame createHltbGame(
            int gameId,
            String gameName,
            int compMain,
            int compPlus,
            int comp100) {
        return new HltbSearchResponse.HltbGame(
                gameId,
                gameName,
                null,  // gameImage
                compMain,
                compPlus,
                comp100,
                0,     // compAll
                0,     // reviewScore
                null   // profilePlatform
        );
    }
}
