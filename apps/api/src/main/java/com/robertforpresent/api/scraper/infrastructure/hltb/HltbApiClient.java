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
     */
    private String buildSearchRequestBody(String gameName) {
        // The HLTB API expects a specific JSON structure
        return String.format("""
            {
                "searchType": "games",
                "searchTerms": ["%s"],
                "searchPage": 1,
                "size": 20,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": "",
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "rangeTime": {"min": null, "max": null},
                        "gameplay": {"perspective": "", "flow": "", "genre": ""},
                        "rangeYear": {"min": "", "max": ""},
                        "modifier": ""
                    },
                    "users": {"sortCategory": "postcount"},
                    "lists": {"sortCategory": "follows"},
                    "filter": "",
                    "sort": 0,
                    "randomizer": 0
                }
            }
            """, escapeJson(gameName));
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
     * Uses fuzzy matching to find the closest match to the search term.
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

        // First, try exact match (case-insensitive)
        for (HltbSearchResponse.HltbGame game : searchResults.data()) {
            if (normalize(game.gameName()).equals(normalizedSearchName)) {
                return Optional.of(game);
            }
        }

        // Then, try contains match
        for (HltbSearchResponse.HltbGame game : searchResults.data()) {
            String normalizedGameName = normalize(game.gameName());
            if (normalizedGameName.contains(normalizedSearchName) ||
                normalizedSearchName.contains(normalizedGameName)) {
                return Optional.of(game);
            }
        }

        // Finally, return first result if it looks similar enough
        HltbSearchResponse.HltbGame firstResult = searchResults.data().get(0);
        double similarity = calculateSimilarity(normalizedSearchName, normalize(firstResult.gameName()));
        if (similarity > 0.6) {
            return Optional.of(firstResult);
        }

        return Optional.empty();
    }

    /**
     * Normalize a string for comparison (lowercase, remove special chars).
     */
    private String normalize(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Calculate similarity between two strings using Jaccard index on words.
     */
    private double calculateSimilarity(String s1, String s2) {
        String[] words1 = s1.split("\\s+");
        String[] words2 = s2.split("\\s+");

        java.util.Set<String> set1 = new java.util.HashSet<>(java.util.Arrays.asList(words1));
        java.util.Set<String> set2 = new java.util.HashSet<>(java.util.Arrays.asList(words2));

        java.util.Set<String> intersection = new java.util.HashSet<>(set1);
        intersection.retainAll(set2);

        java.util.Set<String> union = new java.util.HashSet<>(set1);
        union.addAll(set2);

        if (union.isEmpty()) return 0;
        return (double) intersection.size() / union.size();
    }
}
