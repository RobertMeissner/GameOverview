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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Client for interacting with the HowLongToBeat API.
 * Uses the unofficial search API endpoint.
 */
@Component
public class HltbApiClient {
    private static final Logger logger = LoggerFactory.getLogger(HltbApiClient.class);
    private static final String HLTB_BASE_URL = "https://howlongtobeat.com";
    private static final String HLTB_REFERER = "https://howlongtobeat.com";
    // Search endpoint - extracted dynamically or use fallback
    private static final String FALLBACK_SEARCH_ENDPOINT = "/api/search";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Cached search endpoint and token
    private volatile String searchEndpoint;
    private volatile String authToken;
    private volatile long cacheTime;
    private static final long CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

    public HltbApiClient() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /**
     * Fetch the dynamic search endpoint from HLTB's JavaScript.
     * HLTB may change their API endpoint periodically.
     */
    private String fetchSearchEndpoint() {
        // Return cached endpoint if still valid
        if (searchEndpoint != null && (System.currentTimeMillis() - cacheTime) < CACHE_EXPIRY_MS) {
            return searchEndpoint;
        }

        try {
            // Fetch the main page to find script references
            HttpRequest pageRequest = HttpRequest.newBuilder()
                    .uri(URI.create(HLTB_BASE_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "text/html,application/xhtml+xml")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .GET()
                    .build();

            HttpResponse<String> pageResponse = httpClient.send(pageRequest, HttpResponse.BodyHandlers.ofString());

            if (pageResponse.statusCode() == 200) {
                String html = pageResponse.body();

                // Look for _app JavaScript files
                Pattern scriptPattern = Pattern.compile("/_next/static/chunks/pages/_app-([a-f0-9]+)\\.js");
                Matcher scriptMatcher = scriptPattern.matcher(html);

                if (scriptMatcher.find()) {
                    String scriptUrl = HLTB_BASE_URL + scriptMatcher.group(0);
                    logger.debug("Found HLTB app script: {}", scriptUrl);

                    HttpRequest scriptRequest = HttpRequest.newBuilder()
                            .uri(URI.create(scriptUrl))
                            .timeout(Duration.ofSeconds(15))
                            .header("Accept", "*/*")
                            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                            .header("Referer", HLTB_REFERER)
                            .GET()
                            .build();

                    HttpResponse<String> scriptResponse = httpClient.send(scriptRequest, HttpResponse.BodyHandlers.ofString());

                    if (scriptResponse.statusCode() == 200) {
                        String js = scriptResponse.body();

                        // Look for fetch calls with POST method to find the search endpoint
                        // Pattern: fetch("/api/something", { method: "POST" ...
                        Pattern fetchPattern = Pattern.compile(
                                "fetch\\s*\\(\\s*[\"'](/api/[a-zA-Z0-9_/]+)[\"']\\s*,\\s*\\{[^}]*method:\\s*[\"']POST[\"']",
                                Pattern.CASE_INSENSITIVE | Pattern.DOTALL
                        );
                        Matcher fetchMatcher = fetchPattern.matcher(js);

                        while (fetchMatcher.find()) {
                            String endpoint = fetchMatcher.group(1);
                            // Skip find endpoints, we want search
                            if (!endpoint.contains("find")) {
                                searchEndpoint = HLTB_BASE_URL + endpoint;
                                cacheTime = System.currentTimeMillis();
                                logger.info("Found HLTB search endpoint from JS: {}", searchEndpoint);
                                return searchEndpoint;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error fetching HLTB search endpoint dynamically: {}", e.getMessage());
        }

        // Use fallback
        searchEndpoint = HLTB_BASE_URL + FALLBACK_SEARCH_ENDPOINT;
        cacheTime = System.currentTimeMillis();
        logger.info("Using fallback HLTB search endpoint: {}", searchEndpoint);
        return searchEndpoint;
    }

    /**
     * Fetch authentication token from HLTB.
     * The token may be embedded in the page or returned from an init endpoint.
     */
    private String fetchAuthToken() {
        // Return cached token if still valid
        if (authToken != null && (System.currentTimeMillis() - cacheTime) < CACHE_EXPIRY_MS) {
            return authToken;
        }

        try {
            // Try the init endpoint first
            String initUrl = HLTB_BASE_URL + "/api/search/init?_=" + System.currentTimeMillis();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(initUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "*/*")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Referer", HLTB_REFERER)
                    .header("Origin", HLTB_REFERER)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                var jsonNode = objectMapper.readTree(response.body());
                if (jsonNode.has("token")) {
                    authToken = jsonNode.get("token").asText();
                    logger.info("Successfully fetched HLTB auth token");
                    return authToken;
                }
            }
            logger.debug("HLTB init endpoint did not return token: status={}", response.statusCode());
        } catch (Exception e) {
            logger.debug("Could not fetch HLTB auth token from init endpoint", e);
        }
        return null;
    }

    /**
     * Search for a game on HowLongToBeat.
     *
     * @param gameName The name of the game to search for
     * @return Optional containing search results if successful
     */
    public Optional<HltbSearchResponse> searchGame(String gameName) {
        try {
            // Fetch dynamic search endpoint
            String endpoint = fetchSearchEndpoint();

            // Fetch auth token
            String token = fetchAuthToken();

            // Build the search request body
            String requestBody = buildSearchRequestBody(gameName);

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Accept", "*/*")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Referer", HLTB_REFERER)
                    .header("Origin", HLTB_REFERER);

            // Add auth token if available
            if (token != null) {
                requestBuilder.header("x-auth-token", token);
            }

            HttpRequest request = requestBuilder
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            logger.debug("Searching HLTB for game: {} at endpoint: {}", gameName, endpoint);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                HltbSearchResponse searchResponse = objectMapper.readValue(response.body(), HltbSearchResponse.class);
                int resultCount = searchResponse.data() != null ? searchResponse.data().size() : 0;
                logger.info("HLTB search for '{}' returned {} results", gameName, resultCount);
                return Optional.of(searchResponse);
            } else if (response.statusCode() == 403 || response.statusCode() == 308 || response.statusCode() == 404) {
                // Endpoint or token might be stale, clear cache and retry once
                logger.warn("HLTB returned {}, clearing cache and retrying", response.statusCode());
                searchEndpoint = null;
                authToken = null;
                cacheTime = 0;

                endpoint = fetchSearchEndpoint();
                token = fetchAuthToken();

                HttpRequest.Builder retryBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .header("Accept", "*/*")
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .header("Referer", HLTB_REFERER)
                        .header("Origin", HLTB_REFERER);

                if (token != null) {
                    retryBuilder.header("x-auth-token", token);
                }

                HttpRequest retryRequest = retryBuilder
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> retryResponse = httpClient.send(retryRequest, HttpResponse.BodyHandlers.ofString());
                if (retryResponse.statusCode() == 200) {
                    HltbSearchResponse searchResponse = objectMapper.readValue(retryResponse.body(), HltbSearchResponse.class);
                    int resultCount = searchResponse.data() != null ? searchResponse.data().size() : 0;
                    logger.info("HLTB search for '{}' returned {} results (after retry)", gameName, resultCount);
                    return Optional.of(searchResponse);
                }
                logger.warn("HLTB search failed with status {}: {}", retryResponse.statusCode(), retryResponse.body());
                return Optional.empty();
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
