package com.robertforpresent.api.scraper.infrastructure.igdb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * IGDB implementation of the GameInfoProvider port.
 *
 * This adapter handles all IGDB-specific logic including:
 * - API communication
 * - Response parsing
 * - Data transformation to domain models
 *
 * Marked as @Primary to be the default provider for GameScraperService.
 * Steam provider is used mainly for enrichment, not search.
 */
@Component
@Primary
@Slf4j
public class IgdbGameInfoProvider implements GameInfoProvider {
    private static final String IGDB_API_URL = "https://api.igdb.com/v4";
    private static final String PROVIDER_NAME = "igdb";

    private final IgdbConfig config;
    private final IgdbAuthService authService;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public IgdbGameInfoProvider(IgdbConfig config, IgdbAuthService authService) {
        this.config = config;
        this.authService = authService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<ScrapedGameInfo> searchGames(String query, int limit) {
        if (!isEnabled()) {
            log.info("IGDB is not enabled, returning empty results");
            return List.of();
        }

        Optional<String> tokenOpt = authService.getAccessToken();
        if (tokenOpt.isEmpty()) {
            log.warn("Could not obtain IGDB access token");
            return List.of();
        }

        try {
            return searchIgdb(query, limit, tokenOpt.get());
        } catch (Exception e) {
            log.error("Error searching IGDB for '{}'", query, e);
            return List.of();
        }
    }

    @Override
    public Optional<ScrapedGameInfo> getGameDetails(long externalId) {
        if (!isEnabled()) {
            return Optional.empty();
        }

        Optional<String> tokenOpt = authService.getAccessToken();
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        try {
            String body = String.format(
                    "fields name,summary,cover.url,rating,first_release_date,genres.name,platforms.name,websites.*; where id = %d;",
                    externalId
            );

            JsonNode results = executeIgdbQuery("/games", body, tokenOpt.get());
            if (results.isArray() && !results.isEmpty()) {
                return Optional.of(parseGame(results.get(0)));
            }
        } catch (Exception e) {
            log.error("Error fetching game details for ID {}", externalId, e);
        }

        return Optional.empty();
    }

    @Override
    public boolean isEnabled() {
        return config.isEnabled();
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    private List<ScrapedGameInfo> searchIgdb(String query, int limit, String accessToken) throws Exception {
        String escapedQuery = query.replace("\"", "\\\"");
        String body = String.format(
                "search \"%s\"; fields name,summary,cover.url,rating,first_release_date,genres.name,platforms.name,websites.*; limit %d;",
                escapedQuery,
                Math.min(limit, 20)
        );

        JsonNode results = executeIgdbQuery("/games", body, accessToken);

        List<ScrapedGameInfo> games = new ArrayList<>();
        if (results.isArray()) {
            for (JsonNode gameNode : results) {
                games.add(parseGame(gameNode));
            }
        }

        return games;
    }

    private JsonNode executeIgdbQuery(String endpoint, String body, String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(IGDB_API_URL + endpoint))
                .header("Client-ID", authService.getClientId())
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "text/plain")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            return objectMapper.readTree(response.body());
        } else if (response.statusCode() == 429) {
            log.warn("IGDB rate limit exceeded");
            throw new RuntimeException("Rate limit exceeded");
        } else {
            log.error("IGDB API error: HTTP {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("IGDB API error: " + response.statusCode());
        }
    }

    private ScrapedGameInfo parseGame(JsonNode gameNode) {
        long id = gameNode.get("id").asLong();
        String name = gameNode.has("name") ? gameNode.get("name").asText() : "Unknown";
        String summary = gameNode.has("summary") ? gameNode.get("summary").asText() : null;

        // Parse cover URL - IGDB returns URLs without protocol and with thumbnail size
        String coverUrl = null;
        if (gameNode.has("cover") && gameNode.get("cover").has("url")) {
            String rawUrl = gameNode.get("cover").get("url").asText();
            // Convert to full URL and larger image size
            coverUrl = "https:" + rawUrl.replace("t_thumb", "t_cover_big");
        }

        // Parse rating (IGDB uses 0-100 scale)
        Double rating = gameNode.has("rating") ? gameNode.get("rating").asDouble() : null;

        // Parse release year from Unix timestamp
        Integer releaseYear = null;
        if (gameNode.has("first_release_date")) {
            long timestamp = gameNode.get("first_release_date").asLong();
            releaseYear = Instant.ofEpochSecond(timestamp)
                    .atZone(ZoneId.systemDefault())
                    .getYear();
        }

        // Parse genres
        List<String> genres = new ArrayList<>();
        if (gameNode.has("genres") && gameNode.get("genres").isArray()) {
            for (JsonNode genre : gameNode.get("genres")) {
                if (genre.has("name")) {
                    genres.add(genre.get("name").asText());
                }
            }
        }

        // Parse platforms
        List<String> platforms = new ArrayList<>();
        if (gameNode.has("platforms") && gameNode.get("platforms").isArray()) {
            for (JsonNode platform : gameNode.get("platforms")) {
                if (platform.has("name")) {
                    platforms.add(platform.get("name").asText());
                }
            }
        }

        // Parse store links from websites
        List<ScrapedGameInfo.StoreLink> storeLinks = parseStoreLinks(gameNode);

        return new ScrapedGameInfo(
                id,
                name,
                summary,
                coverUrl,
                rating,
                releaseYear,
                genres,
                platforms,
                storeLinks,
                null, // Playtime would come from HowLongToBeat integration
                PROVIDER_NAME
        );
    }

    private List<ScrapedGameInfo.StoreLink> parseStoreLinks(JsonNode gameNode) {
        List<ScrapedGameInfo.StoreLink> links = new ArrayList<>();

        if (!gameNode.has("websites") || !gameNode.get("websites").isArray()) {
            return links;
        }

        for (JsonNode website : gameNode.get("websites")) {
            if (!website.has("url") || !website.has("category")) {
                continue;
            }

            String url = website.get("url").asText();
            int category = website.get("category").asInt();

            // IGDB website categories: 13=Steam, 16=Epic, 17=GOG
            String storeName = switch (category) {
                case 13 -> "Steam";
                case 16 -> "Epic Games";
                case 17 -> "GOG";
                case 1 -> "Official";
                default -> null;
            };

            if (storeName != null) {
                String storeId = extractStoreId(url, category);
                links.add(new ScrapedGameInfo.StoreLink(storeName, url, storeId));
            }
        }

        return links;
    }

    private String extractStoreId(String url, int category) {
        try {
            if (category == 13 && url.contains("store.steampowered.com/app/")) {
                // Extract Steam app ID from URL like https://store.steampowered.com/app/123456/
                String[] parts = url.split("/app/");
                if (parts.length > 1) {
                    String idPart = parts[1].split("/")[0];
                    return idPart.replaceAll("[^0-9]", "");
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract store ID from URL: {}", url);
        }
        return null;
    }
}
