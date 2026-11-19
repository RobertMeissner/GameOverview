package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Client for interacting with the HowLongToBeat internal search API.
 *
 * <p>HLTB renames its search endpoint from time to time (e.g. /api/bleed -&gt; /api/search/site
 * in late 2026). The client uses the current default path, and on a 404 rediscovers the path from
 * the site's own JavaScript chunks (at most once every 10 minutes). A session token is fetched
 * from {@code <path>/init?t=<ms>} and sent as {@code x-auth-token}; if the site still returns a
 * honeypot key/value pair, it is echoed back as headers and in the payload.</p>
 */
@Component
public class HltbApiClient {
    private static final Logger logger = LoggerFactory.getLogger(HltbApiClient.class);
    private static final String HLTB_BASE_URL = "https://howlongtobeat.com";
    private static final String HLTB_REFERER = "https://howlongtobeat.com";
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // Current default; older paths are tried as legacy fallbacks.
    private static final String DEFAULT_SEARCH_PATH = "/api/search/site";
    private static final String[] LEGACY_SEARCH_PATHS = {"/api/bleed", "/api/search", "/api/s"};
    private static final long TOKEN_CACHE_MS = 60 * 60 * 1000; // 1 hour
    private static final long DISCOVERY_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

    // Matches the token bootstrap call in HLTB's JS, e.g. fetch("/api/search/site/init?t=...")
    private static final Pattern SEARCH_PATH_PATTERN =
            Pattern.compile("[\"'`](\\/api\\/[A-Za-z0-9_\\-/]+?)\\/init\\?t=");
    // Matches script chunk URLs in the homepage HTML, e.g. "/_next/static/chunks/abc123.js"
    private static final Pattern SCRIPT_CHUNK_PATTERN =
            Pattern.compile("[\"'](/_next/static/chunks/[^\"']+\\.js)[\"']");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private volatile String searchPath = DEFAULT_SEARCH_PATH;
    private volatile String authToken;
    private volatile String hpKey;
    private volatile String hpVal;
    private volatile long tokenFetchedAt;
    private volatile long lastDiscoveryAt;

    public HltbApiClient(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Search for a game on HowLongToBeat.
     *
     * @param gameName The name of the game to search for
     * @return Optional containing search results if successful
     */
    public Optional<HltbSearchResponse> searchGame(String gameName) {
        String requestBody = buildSearchRequestBody(gameName);

        // Current path, with one token refresh on 401/403 and one endpoint rediscovery on 404
        Optional<HltbSearchResponse> result = postSearch(searchPath, requestBody, true, true);
        if (result.isPresent()) {
            logResult(gameName, result.get(), searchPath);
            return result;
        }

        // Legacy paths as fallback
        for (String legacyPath : LEGACY_SEARCH_PATHS) {
            if (legacyPath.equals(searchPath)) {
                continue;
            }
            logger.debug("Trying legacy HLTB endpoint: {}", legacyPath);
            result = postSearch(legacyPath, requestBody, true, false);
            if (result.isPresent()) {
                searchPath = legacyPath;
                logResult(gameName, result.get(), legacyPath);
                return result;
            }
        }

        logger.warn("All HLTB endpoints failed for search: {}", gameName);
        return Optional.empty();
    }

    /**
     * POST the search body to the given path. On 401/403 the token is refreshed and the request
     * retried once (if {@code allowTokenRetry}); on 404/405 the endpoint is rediscovered from the
     * site's JavaScript and the request retried once (if {@code allowDiscovery}).
     */
    private Optional<HltbSearchResponse> postSearch(String path, String requestBody,
                                                     boolean allowTokenRetry, boolean allowDiscovery) {
        try {
            String token = fetchAuthToken(path);
            HttpResponse<String> response = sendSearch(path, token, requestBody);

            if (response.statusCode() == 200) {
                return Optional.of(objectMapper.readValue(response.body(), HltbSearchResponse.class));
            }

            if ((response.statusCode() == 401 || response.statusCode() == 403) && allowTokenRetry) {
                logger.debug("HLTB search at {} returned {}, refreshing token and retrying", path, response.statusCode());
                clearToken();
                token = fetchAuthToken(path);
                response = sendSearch(path, token, requestBody);
                if (response.statusCode() == 200) {
                    return Optional.of(objectMapper.readValue(response.body(), HltbSearchResponse.class));
                }
            }

            if ((response.statusCode() == 404 || response.statusCode() == 405) && allowDiscovery) {
                String discovered = discoverSearchPath();
                if (discovered != null && !discovered.equals(path)) {
                    logger.info("HLTB search endpoint moved: {} -> {}, retrying", path, discovered);
                    searchPath = discovered;
                    clearToken();
                    return postSearch(discovered, requestBody, allowTokenRetry, false);
                }
            }

            logger.debug("HLTB endpoint {} returned status {}", path, response.statusCode());
            return Optional.empty();
        } catch (Exception e) {
            logger.debug("HLTB endpoint {} failed: {}", path, e.getMessage());
            return Optional.empty();
        }
    }

    private HttpResponse<String> sendSearch(String path, String token, String requestBody) throws Exception {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(HLTB_BASE_URL + path))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "*/*")
                .header("User-Agent", USER_AGENT)
                .header("Referer", HLTB_REFERER)
                .header("Origin", HLTB_REFERER)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody));

        if (token != null) {
            requestBuilder.header("x-auth-token", token);
        }
        if (hpKey != null && hpVal != null) {
            requestBuilder.header("x-hp-key", hpKey).header("x-hp-val", hpVal);
        }

        return httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
    }

    /**
     * Fetch a session token from {@code <path>/init?t=<ms>}. Cached for one hour.
     * The honeypot key/value is optional on current HLTB versions.
     */
    private String fetchAuthToken(String path) {
        if (authToken != null && (System.currentTimeMillis() - tokenFetchedAt) < TOKEN_CACHE_MS) {
            return authToken;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(HLTB_BASE_URL + path + "/init?t=" + System.currentTimeMillis()))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "*/*")
                    .header("User-Agent", USER_AGENT)
                    .header("Referer", HLTB_REFERER)
                    .header("Origin", HLTB_REFERER)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                if (json.has("token")) {
                    authToken = json.get("token").asText();
                    hpKey = json.hasNonNull("hpKey") ? json.get("hpKey").asText() : null;
                    hpVal = json.hasNonNull("hpVal") ? json.get("hpVal").asText() : null;
                    tokenFetchedAt = System.currentTimeMillis();
                    logger.debug("Fetched HLTB auth token from {}", path);
                    return authToken;
                }
            }
            logger.debug("HLTB init endpoint {} did not return a token: status={}", path, response.statusCode());
        } catch (Exception e) {
            logger.debug("Could not fetch HLTB auth token from {}: {}", path, e.getMessage());
        }
        return null;
    }

    private void clearToken() {
        authToken = null;
        hpKey = null;
        hpVal = null;
        tokenFetchedAt = 0;
    }

    /**
     * Read HLTB's homepage and its script chunks to find the current search endpoint
     * (the JS contains the token bootstrap call {@code "<path>/init?t=..."}).
     * Returns the discovered path, or null if none found / still on cooldown.
     */
    private String discoverSearchPath() {
        if (System.currentTimeMillis() - lastDiscoveryAt < DISCOVERY_COOLDOWN_MS) {
            return null;
        }
        lastDiscoveryAt = System.currentTimeMillis();

        try {
            HttpRequest pageRequest = HttpRequest.newBuilder()
                    .uri(URI.create(HLTB_BASE_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "text/html,application/xhtml+xml")
                    .header("User-Agent", USER_AGENT)
                    .GET()
                    .build();

            HttpResponse<String> pageResponse = httpClient.send(pageRequest, HttpResponse.BodyHandlers.ofString());
            if (pageResponse.statusCode() != 200) {
                return null;
            }

            Set<String> chunks = new LinkedHashSet<>();
            Matcher chunkMatcher = SCRIPT_CHUNK_PATTERN.matcher(pageResponse.body());
            while (chunkMatcher.find()) {
                chunks.add(chunkMatcher.group(1));
            }

            for (String chunk : chunks) {
                try {
                    HttpRequest scriptRequest = HttpRequest.newBuilder()
                            .uri(URI.create(HLTB_BASE_URL + chunk))
                            .timeout(Duration.ofSeconds(15))
                            .header("Accept", "*/*")
                            .header("User-Agent", USER_AGENT)
                            .header("Referer", HLTB_REFERER)
                            .GET()
                            .build();

                    HttpResponse<String> scriptResponse = httpClient.send(scriptRequest, HttpResponse.BodyHandlers.ofString());
                    if (scriptResponse.statusCode() == 200) {
                        Matcher pathMatcher = SEARCH_PATH_PATTERN.matcher(scriptResponse.body());
                        if (pathMatcher.find()) {
                            String path = pathMatcher.group(1);
                            logger.info("Discovered HLTB search endpoint from {}: {}", chunk, path);
                            return path;
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Could not scan HLTB script chunk {}: {}", chunk, e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.debug("HLTB endpoint discovery failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Build the JSON request body for the HLTB search API.
     * Since the site's 2026 redesign, filters use the {@code {mode, values}} shape.
     */
    private String buildSearchRequestBody(String gameName) {
        String[] words = gameName.trim().split("\\s+");
        StringBuilder termsArray = new StringBuilder("[");
        for (int i = 0; i < words.length; i++) {
            if (i > 0) termsArray.append(", ");
            termsArray.append("\"").append(escapeJson(words[i])).append("\"");
        }
        termsArray.append("]");

        String anyFilter = "{\"mode\": \"include\", \"values\": []}";
        String body = String.format("""
            {
                "searchType": "games",
                "searchTerms": %s,
                "searchPage": 1,
                "size": 20,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": %s,
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "rangeTime": {"min": null, "max": null},
                        "gameplay": {
                            "perspective": %s,
                            "flow": %s,
                            "genre": %s
                        },
                        "year": %s,
                        "modifier": ""
                    },
                    "users": {"sortCategory": "postcount"},
                    "lists": {"sortCategory": "follows"},
                    "filter": "",
                    "sort": 0,
                    "randomizer": 0
                },
                "useCache": true
            }
            """, termsArray, anyFilter, anyFilter, anyFilter, anyFilter, anyFilter);

        // Echo the honeypot key/value in the payload if the site provided one
        if (hpKey != null && hpVal != null) {
            body = body.replace("\"useCache\": true",
                    "\"useCache\": true, \"" + escapeJson(hpKey) + "\": \"" + escapeJson(hpVal) + "\"");
        }
        return body;
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

    private void logResult(String gameName, HltbSearchResponse result, String path) {
        int resultCount = result.data() != null ? result.data().size() : 0;
        logger.info("HLTB search for '{}' returned {} results (via {})", gameName, resultCount, path);
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
