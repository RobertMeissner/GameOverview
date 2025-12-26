package com.robertforpresent.api.scraper.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robertforpresent.api.scraper.infrastructure.config.IgdbConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Service for managing IGDB/Twitch OAuth authentication.
 * Handles token acquisition and refresh.
 */
@Service
@Slf4j
public class IgdbAuthService {
    private static final String TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

    private final IgdbConfig config;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private String accessToken;
    private Instant tokenExpiry;

    public IgdbAuthService(IgdbConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Gets a valid access token, refreshing if necessary.
     */
    public Optional<String> getAccessToken() {
        if (!config.isEnabled()) {
            log.warn("IGDB integration is not enabled or credentials are missing");
            return Optional.empty();
        }

        if (isTokenValid()) {
            return Optional.of(accessToken);
        }

        return refreshToken();
    }

    private boolean isTokenValid() {
        return accessToken != null &&
               tokenExpiry != null &&
               Instant.now().isBefore(tokenExpiry.minus(Duration.ofMinutes(5)));
    }

    private Optional<String> refreshToken() {
        String url = String.format(
                "%s?client_id=%s&client_secret=%s&grant_type=client_credentials",
                TWITCH_TOKEN_URL,
                config.getClientId(),
                config.getClientSecret()
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                accessToken = json.get("access_token").asText();
                int expiresIn = json.get("expires_in").asInt();
                tokenExpiry = Instant.now().plusSeconds(expiresIn);
                log.info("Successfully obtained IGDB access token, expires in {} seconds", expiresIn);
                return Optional.of(accessToken);
            } else {
                log.error("Failed to obtain IGDB access token: HTTP {}", response.statusCode());
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("Error obtaining IGDB access token", e);
            return Optional.empty();
        }
    }

    public String getClientId() {
        return config.getClientId();
    }
}
