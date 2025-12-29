package com.robertforpresent.api.scraper.infrastructure.steam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamAppDetailsResponse;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamOwnedGamesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Component
public class SteamApiClient {
    private static final Logger logger = LoggerFactory.getLogger(SteamApiClient.class);
    private static final String STORE_API_URL = "https://store.steampowered.com/api";

    private final SteamConfig config;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SteamApiClient(SteamConfig config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Get owned games for a Steam user including playtime information.
     * Requires Steam API key.
     *
     * @param steamId The Steam ID (64-bit)
     * @return Response containing list of owned games with playtime
     */
    public Optional<SteamOwnedGamesResponse> getOwnedGames(String steamId) {
        try {
            String url = String.format("%s/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&include_appinfo=true&include_played_free_games=true&format=json",
                    config.getApiUrl(),
                    URLEncoder.encode(config.getApiKey(), StandardCharsets.UTF_8),
                    URLEncoder.encode(steamId, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            logger.debug("Fetching owned games for Steam ID: {}", steamId);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                SteamOwnedGamesResponse ownedGames = objectMapper.readValue(response.body(), SteamOwnedGamesResponse.class);
                logger.info("Successfully fetched {} owned games for Steam ID: {}",
                    ownedGames.response() != null ? ownedGames.response().gameCount() : 0, steamId);
                return Optional.of(ownedGames);
            } else {
                logger.error("Failed to fetch owned games. Status: {}, Body: {}", response.statusCode(), response.body());
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Error fetching owned games for Steam ID: {}", steamId, e);
            return Optional.empty();
        }
    }

    /**
     * Get detailed information about a Steam app/game.
     * This uses the public Store API which doesn't require an API key.
     *
     * @param appId The Steam app ID
     * @return Response containing app details
     */
    public Optional<SteamAppDetailsResponse> getAppDetails(int appId) {
        try {
            String url = String.format("%s/appdetails?appids=%d", STORE_API_URL, appId);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            logger.debug("Fetching app details for Steam app ID: {}", appId);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // Parse the response which has format: {"appid": {"success": true, "data": {...}}}
                Map<String, SteamAppDetailsResponse> responseMap = objectMapper.readValue(
                    response.body(),
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, SteamAppDetailsResponse.class)
                );

                SteamAppDetailsResponse appDetails = responseMap.get(String.valueOf(appId));
                if (appDetails != null && appDetails.success()) {
                    logger.info("Successfully fetched app details for: {}", appDetails.data().name());
                    return Optional.of(appDetails);
                } else {
                    logger.warn("App details not found or unsuccessful for app ID: {}", appId);
                    return Optional.empty();
                }
            } else {
                logger.error("Failed to fetch app details. Status: {}, Body: {}", response.statusCode(), response.body());
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Error fetching app details for app ID: {}", appId, e);
            return Optional.empty();
        }
    }

    /**
     * Validate if Steam ID exists and profile is public.
     * This is useful before attempting to fetch owned games.
     *
     * @param steamId The Steam ID to validate
     * @return true if valid and accessible
     */
    public boolean validateSteamId(String steamId) {
        try {
            String url = String.format("%s/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s",
                    config.getApiUrl(),
                    URLEncoder.encode(config.getApiKey(), StandardCharsets.UTF_8),
                    URLEncoder.encode(steamId, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // Parse response to check if player exists
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                Map<String, Object> responseData = (Map<String, Object>) responseMap.get("response");
                if (responseData != null) {
                    var players = (java.util.List<?>) responseData.get("players");
                    return players != null && !players.isEmpty();
                }
            }
            return false;
        } catch (Exception e) {
            logger.error("Error validating Steam ID: {}", steamId, e);
            return false;
        }
    }
}
