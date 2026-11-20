/* (C)2026 */
package com.robertforpresent.api.scraper.infrastructure.steam;

import com.robertforpresent.api.scraper.domain.port.SteamLibraryPort;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamOwnedGamesResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Adapter implementing {@link SteamLibraryPort} on top of {@link SteamApiClient}.
 * Maps the Steam API DTOs to the port's domain records.
 */
@Component
public class SteamLibraryPortAdapter implements SteamLibraryPort {

    private final SteamConfig config;
    private final SteamApiClient apiClient;

    public SteamLibraryPortAdapter(SteamConfig config, SteamApiClient apiClient) {
        this.config = config;
        this.apiClient = apiClient;
    }

    @Override
    public boolean isEnabled() {
        return config.isEnabled();
    }

    @Override
    public boolean isValidSteamId(String steamId) {
        return apiClient.validateSteamId(steamId);
    }

    @Override
    public Optional<List<OwnedGame>> getOwnedGames(String steamId) {
        return apiClient
                .getOwnedGames(steamId)
                .map(response -> {
                    List<SteamOwnedGamesResponse.SteamGame> games =
                            response.response() != null ? response.response().games() : null;
                    if (games == null) {
                        return List.<OwnedGame>of();
                    }
                    return games.stream()
                            .map(g -> new OwnedGame(g.appId(), g.name(), g.playtimeForever()))
                            .toList();
                });
    }

    @Override
    public Optional<AppDetails> getAppDetails(int appId) {
        return apiClient
                .getAppDetails(appId)
                .filter(details -> details.success() && details.data() != null)
                .map(details ->
                        new AppDetails(details.data().name(), details.data().headerImage()));
    }
}
