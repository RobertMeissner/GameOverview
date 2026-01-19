package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.robertforpresent.api.scraper.infrastructure.hltb.dto.HltbSearchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
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

        @Test
        @DisplayName("handles games with subtitles")
        void handlesGamesWithSubtitles() {
            var game = createHltbGame(1, "Horizon Zero Dawn: Complete Edition", 40, 60, 80);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Horizon Zero Dawn");

            assertTrue(result.isPresent());
            assertEquals("Horizon Zero Dawn: Complete Edition", result.get().gameName());
        }

        @Test
        @DisplayName("handles games with ampersand")
        void handlesGamesWithAmpersand() {
            var game = createHltbGame(1, "Ratchet & Clank", 12, 18, 25);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Ratchet and Clank");

            assertTrue(result.isPresent());
            assertEquals("Ratchet & Clank", result.get().gameName());
        }

        @Test
        @DisplayName("handles empty search term")
        void handlesEmptySearchTerm() {
            var game = createHltbGame(1, "Test Game", 10, 20, 30);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "");

            // Should return first result as fallback
            assertTrue(result.isPresent());
        }

        @Test
        @DisplayName("handles null game name in results")
        void handlesNullGameName() {
            var game = new HltbSearchResponse.HltbGame(1, null, null, 10, 20, 30, 0, 0, null);
            var response = new HltbSearchResponse(List.of(game));

            var result = apiClient.findBestMatch(response, "Test Game");

            // Should still return result (fallback behavior)
            assertTrue(result.isPresent());
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

        @Test
        @DisplayName("handles large playtime values")
        void handlesLargePlaytimeValues() {
            // 360000 seconds = 100 hours
            var game = createHltbGame(1, "Long RPG", 360000, 540000, 720000);

            assertEquals(100.0, game.mainStoryHours(), 0.01);
            assertEquals(150.0, game.mainExtraHours(), 0.01);
            assertEquals(200.0, game.completionistHours(), 0.01);
        }
    }

    @Nested
    @DisplayName("buildSearchRequestBody()")
    class BuildSearchRequestBodyTests {

        @Test
        @DisplayName("builds valid JSON for single word game name")
        void buildsValidJson_singleWord() throws Exception {
            String requestBody = invokeBuildSearchRequestBody("Hades");

            assertTrue(requestBody.contains("\"searchTerms\": [\"Hades\"]"));
            assertTrue(requestBody.contains("\"searchType\": \"games\""));
            assertTrue(requestBody.contains("\"searchPage\": 1"));
            assertTrue(requestBody.contains("\"size\": 20"));
        }

        @Test
        @DisplayName("builds valid JSON for multi-word game name")
        void buildsValidJson_multiWord() throws Exception {
            String requestBody = invokeBuildSearchRequestBody("Dark Souls III");

            assertTrue(requestBody.contains("\"searchTerms\": [\"Dark\", \"Souls\", \"III\"]"));
        }

        @Test
        @DisplayName("escapes quotes in game name")
        void escapesQuotes() throws Exception {
            String requestBody = invokeBuildSearchRequestBody("Game \"With\" Quotes");

            assertTrue(requestBody.contains("\\\"With\\\""));
        }

        @Test
        @DisplayName("handles game name with extra whitespace")
        void handlesExtraWhitespace() throws Exception {
            String requestBody = invokeBuildSearchRequestBody("  Dark   Souls  ");

            assertTrue(requestBody.contains("\"searchTerms\": [\"Dark\", \"Souls\"]"));
        }

        @Test
        @DisplayName("includes required search options")
        void includesRequiredSearchOptions() throws Exception {
            String requestBody = invokeBuildSearchRequestBody("Test");

            assertTrue(requestBody.contains("\"searchOptions\""));
            assertTrue(requestBody.contains("\"games\""));
            assertTrue(requestBody.contains("\"sortCategory\": \"popular\""));
            assertTrue(requestBody.contains("\"rangeCategory\": \"main\""));
        }

        /**
         * Helper to invoke the private buildSearchRequestBody method.
         */
        private String invokeBuildSearchRequestBody(String gameName) throws Exception {
            Method method = HltbApiClient.class.getDeclaredMethod("buildSearchRequestBody", String.class);
            method.setAccessible(true);
            return (String) method.invoke(apiClient, gameName);
        }
    }

    @Nested
    @DisplayName("escapeJson()")
    class EscapeJsonTests {

        @Test
        @DisplayName("escapes backslashes")
        void escapesBackslashes() throws Exception {
            String result = invokeEscapeJson("path\\to\\file");

            assertEquals("path\\\\to\\\\file", result);
        }

        @Test
        @DisplayName("escapes quotes")
        void escapesQuotes() throws Exception {
            String result = invokeEscapeJson("say \"hello\"");

            assertEquals("say \\\"hello\\\"", result);
        }

        @Test
        @DisplayName("escapes newlines")
        void escapesNewlines() throws Exception {
            String result = invokeEscapeJson("line1\nline2");

            assertEquals("line1\\nline2", result);
        }

        @Test
        @DisplayName("escapes carriage returns")
        void escapesCarriageReturns() throws Exception {
            String result = invokeEscapeJson("line1\rline2");

            assertEquals("line1\\rline2", result);
        }

        @Test
        @DisplayName("escapes tabs")
        void escapesTabs() throws Exception {
            String result = invokeEscapeJson("col1\tcol2");

            assertEquals("col1\\tcol2", result);
        }

        @Test
        @DisplayName("handles normal text unchanged")
        void handlesNormalText() throws Exception {
            String result = invokeEscapeJson("Normal Game Name 123");

            assertEquals("Normal Game Name 123", result);
        }

        @Test
        @DisplayName("handles empty string")
        void handlesEmptyString() throws Exception {
            String result = invokeEscapeJson("");

            assertEquals("", result);
        }

        /**
         * Helper to invoke the private escapeJson method.
         */
        private String invokeEscapeJson(String text) throws Exception {
            Method method = HltbApiClient.class.getDeclaredMethod("escapeJson", String.class);
            method.setAccessible(true);
            return (String) method.invoke(apiClient, text);
        }
    }

    @Nested
    @DisplayName("Levenshtein similarity")
    class LevenshteinSimilarityTests {

        @Test
        @DisplayName("returns 1.0 for identical strings")
        void returnsOne_forIdenticalStrings() throws Exception {
            double similarity = invokeCalculateSimilarity("test", "test");

            assertEquals(1.0, similarity, 0.001);
        }

        @Test
        @DisplayName("returns 0.0 for completely different strings")
        void returnsLow_forDifferentStrings() throws Exception {
            double similarity = invokeCalculateSimilarity("abc", "xyz");

            assertTrue(similarity < 0.5);
        }

        @Test
        @DisplayName("returns high similarity for similar strings")
        void returnsHigh_forSimilarStrings() throws Exception {
            double similarity = invokeCalculateSimilarity("dark souls", "dark soul");

            assertTrue(similarity > 0.8);
        }

        @Test
        @DisplayName("handles empty first string")
        void handlesEmptyFirstString() throws Exception {
            double similarity = invokeCalculateSimilarity("", "test");

            assertEquals(0.0, similarity);
        }

        @Test
        @DisplayName("handles empty second string")
        void handlesEmptySecondString() throws Exception {
            double similarity = invokeCalculateSimilarity("test", "");

            assertEquals(0.0, similarity);
        }

        @Test
        @DisplayName("handles both empty strings")
        void handlesBothEmptyStrings() throws Exception {
            double similarity = invokeCalculateSimilarity("", "");

            assertEquals(1.0, similarity);
        }

        /**
         * Helper to invoke the private calculateLevenshteinSimilarity method.
         */
        private double invokeCalculateSimilarity(String s1, String s2) throws Exception {
            Method method = HltbApiClient.class.getDeclaredMethod("calculateLevenshteinSimilarity", String.class, String.class);
            method.setAccessible(true);
            return (double) method.invoke(apiClient, s1, s2);
        }
    }

    @Nested
    @DisplayName("normalize()")
    class NormalizeTests {

        @Test
        @DisplayName("converts to lowercase")
        void convertsToLowercase() throws Exception {
            String result = invokeNormalize("UPPERCASE");

            assertEquals("uppercase", result);
        }

        @Test
        @DisplayName("removes special characters")
        void removesSpecialCharacters() throws Exception {
            String result = invokeNormalize("Game: The Sequel!");

            assertEquals("game the sequel", result);
        }

        @Test
        @DisplayName("normalizes multiple spaces")
        void normalizesMultipleSpaces() throws Exception {
            String result = invokeNormalize("Game    Name");

            assertEquals("game name", result);
        }

        @Test
        @DisplayName("trims whitespace")
        void trimsWhitespace() throws Exception {
            String result = invokeNormalize("  Game Name  ");

            assertEquals("game name", result);
        }

        @Test
        @DisplayName("keeps numbers")
        void keepsNumbers() throws Exception {
            String result = invokeNormalize("Portal 2");

            assertEquals("portal 2", result);
        }

        @Test
        @DisplayName("handles null")
        void handlesNull() throws Exception {
            String result = invokeNormalize(null);

            assertEquals("", result);
        }

        /**
         * Helper to invoke the private normalize method.
         */
        private String invokeNormalize(String text) throws Exception {
            Method method = HltbApiClient.class.getDeclaredMethod("normalize", String.class);
            method.setAccessible(true);
            return (String) method.invoke(apiClient, text);
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
