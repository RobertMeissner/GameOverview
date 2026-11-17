package com.robertforpresent.api.scraper.infrastructure.steam;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamAppDetailsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SteamEnrichmentProviderTest {

    @Mock
    private SteamConfig config;

    @Mock
    private SteamApiClient apiClient;

    private SteamEnrichmentProvider provider;

    @BeforeEach
    void setUp() {
        provider = new SteamEnrichmentProvider(config, apiClient);
    }

    private SteamAppDetailsResponse appDetails(int appId, String name) {
        return new SteamAppDetailsResponse(
                true,
                new SteamAppDetailsResponse.AppData(
                        "game", name, appId,
                        null, false,
                        null, null, null, null, null, null,
                        null, null, null, null, null, null, null, null
                )
        );
    }

    @Test
    @DisplayName("resolves a missing Steam App ID via exact-name store search")
    void resolvesMissingSteamAppIdByName() {
        var game = new CanonicalGame.Builder("Cyberpunk 2077")
                .setId(UUID.randomUUID())
                .setGenres(List.of("RPG"))
                .build();

        when(apiClient.findAppIdByName("Cyberpunk 2077")).thenReturn(Optional.of(1091500));
        when(apiClient.getAppDetails(1091500)).thenReturn(Optional.of(appDetails(1091500, "Cyberpunk 2077")));

        var result = provider.enrichGame(game);

        assertTrue(result.enriched());
        assertEquals(1091500, result.game().getSteamData().appId());
        assertEquals("Cyberpunk 2077", result.game().getSteamData().name());
        assertEquals(List.of("RPG"), result.game().getGenres());
    }

    @Test
    @DisplayName("reports no change when no App ID exists and no exact Steam match is found")
    void noChangeWhenNoAppIdAndNoMatch() {
        var game = new CanonicalGame.Builder("Unknown Game")
                .setId(UUID.randomUUID())
                .build();

        when(apiClient.findAppIdByName("Unknown Game")).thenReturn(Optional.empty());

        var result = provider.enrichGame(game);

        assertFalse(result.enriched());
    }

    @Test
    @DisplayName("keeps the existing App ID and does not consult the store search")
    void keepsExistingAppId() {
        var game = new CanonicalGame.Builder("Cyberpunk 2077")
                .setId(UUID.randomUUID())
                .setSteamData(new SteamGameData(1091500, "Cyberpunk 2077"))
                .build();

        when(apiClient.getAppDetails(1091500)).thenReturn(Optional.of(appDetails(1091500, "Cyberpunk 2077")));

        var result = provider.enrichGame(game);

        assertTrue(result.enriched());
        assertEquals(1091500, result.game().getSteamData().appId());
        org.mockito.Mockito.verify(apiClient, org.mockito.Mockito.never()).findAppIdByName(org.mockito.ArgumentMatchers.anyString());
    }
}
