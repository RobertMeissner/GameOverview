package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.robertforpresent.api.scraper.infrastructure.hltb.dto.HltbSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

/**
 * Client for interacting with the HowLongToBeat API.
 * Uses the unofficial search API endpoint.
 */
@Component
public class HltbApiClient {
    private static final Logger logger = LoggerFactory.getLogger(HltbApiClient.class);
    private static final String HLTB_SEARCH_URL = "https://howlongtobeat.com/api/search";
    private static final String HLTB_REFERER = "https://howlongtobeat.com";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public HltbApiClient() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Search for a game on HowLongToBeat.
     *
     * @param gameName The name of the game to search for
     * @return Optional containing search results if successful
     */
    public Optional<HltbSearchResponse> searchGame(String gameName) {
        try {
            // Build the search request body
            String requestBody = buildSearchRequestBody(gameName);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(HLTB_SEARCH_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Accept", "*/*")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .header("Referer", HLTB_REFERER)
                    .header("Origin", HLTB_REFERER)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            logger.debug("Searching HLTB for game: {}", gameName);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                HltbSearchResponse searchResponse = objectMapper.readValue(response.body(), HltbSearchResponse.class);
                int resultCount = searchResponse.data() != null ? searchResponse.data().size() : 0;
                logger.info("HLTB search for '{}' returned {} results", gameName, resultCount);
                return Optional.of(searchResponse);
            } else {
                logger.warn("HLTB search failed with status {}: {}", response.statusCode(), response.body());
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Error searching HLTB for game: {}", gameName, e);
            return Optional.empty();
        }
    }

    /**
     * Build the JSON request body for HLTB search API.
     * The API expects searchTerms as an array of individual words.
     */
    private String buildSearchRequestBody(String gameName) {
        // Split game name into individual words for searchTerms array
        String[] words = gameName.trim().split("\\s+");
        StringBuilder termsArray = new StringBuilder("[");
        for (int i = 0; i < words.length; i++) {
            if (i > 0) termsArray.append(", ");
            termsArray.append("\"").append(escapeJson(words[i])).append("\"");
        }
        termsArray.append("]");

        // The HLTB API expects a specific JSON structure
        return String.format("""
            {
                "searchType": "games",
                "searchTerms": %s,
                "searchPage": 1,
                "size": 20,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": "",
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "rangeTime": {"min": 0, "max": 0},
                        "gameplay": {"perspective": "", "flow": "", "genre": ""},
                        "modifier": ""
                    },
                    "users": {"sortCategory": "postcount"},
                    "filter": "",
                    "sort": 0,
                    "randomizer": 0
                }
            }
            """, termsArray.toString());
    }

    /**
     * Escape special characters in JSON string.
     */
    private String escapeJson(String text) {
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Find the best matching game from search results.
     * Uses fuzzy matching with Levenshtein distance to find the closest match.
     *
     * @param searchResults The search results from HLTB
     * @param gameName      The game name we're looking for
     * @return The best matching game if found
     */
    public Optional<HltbSearchResponse.HltbGame> findBestMatch(HltbSearchResponse searchResults, String gameName) {
        if (searchResults.data() == null || searchResults.data().isEmpty()) {
            return Optional.empty();
        }

        String normalizedSearchName = normalize(gameName);
        HltbSearchResponse.HltbGame bestMatch = null;
        double bestSimilarity = 0;

        for (HltbSearchResponse.HltbGame game : searchResults.data()) {
            String normalizedGameName = normalize(game.gameName());

            // Exact match is always best
            if (normalizedGameName.equals(normalizedSearchName)) {
                logger.debug("Found exact match for '{}': {}", gameName, game.gameName());
                return Optional.of(game);
            }

            // Calculate similarity using Levenshtein distance
            double similarity = calculateLevenshteinSimilarity(normalizedSearchName, normalizedGameName);

            // Also check if one contains the other (boost similarity)
            if (normalizedGameName.contains(normalizedSearchName) ||
                normalizedSearchName.contains(normalizedGameName)) {
                similarity = Math.max(similarity, 0.85);
            }

            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = game;
            }
        }

        // Accept match if similarity is above threshold
        if (bestMatch != null && bestSimilarity >= 0.5) {
            logger.debug("Best match for '{}': '{}' (similarity: {})",
                    gameName, bestMatch.gameName(), String.format("%.2f", bestSimilarity));
            return Optional.of(bestMatch);
        }

        // Fall back to first result if we have results but low similarity
        // HLTB search is usually good at returning relevant results first
        if (!searchResults.data().isEmpty()) {
            HltbSearchResponse.HltbGame firstResult = searchResults.data().get(0);
            logger.debug("Using first HLTB result for '{}': '{}'", gameName, firstResult.gameName());
            return Optional.of(firstResult);
        }

        return Optional.empty();
    }

    /**
     * Normalize a string for comparison (lowercase, remove special chars).
     */
    private String normalize(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance.
     * Returns a value between 0 and 1, where 1 is identical.
     */
    private double calculateLevenshteinSimilarity(String s1, String s2) {
        if (s1.equals(s2)) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;

        int distance = levenshteinDistance(s1, s2);
        int maxLength = Math.max(s1.length(), s2.length());
        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * Calculate Levenshtein (edit) distance between two strings.
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }
}
