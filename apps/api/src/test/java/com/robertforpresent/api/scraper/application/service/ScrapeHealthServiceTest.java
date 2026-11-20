package com.robertforpresent.api.scraper.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapeHealthServiceTest {

    @Mock
    private GameInfoProvider gameInfoProvider;

    @Mock
    private GameEnrichmentProvider enrichmentProvider;

    @Mock
    private CatalogLookup catalogLookup;

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<Void> httpResponse;

    private ScrapeHealthService service;

    @BeforeEach
    void setUp() {
        service = new ScrapeHealthService(gameInfoProvider, List.of(enrichmentProvider), catalogLookup,
                httpClient, List.of("Hades"));
    }

    private ScrapedGameInfo hades() {
        return new ScrapedGameInfo(
                68151L,
                "Hades",
                "hades",
                null,
                "https://images.igdb.com/igdb/image/upload/t_cover_big/co4q1f.jpg",
                92.0,
                2020,
                List.of("Roguelike"),
                List.of("PC"),
                List.of(new ScrapedGameInfo.StoreLink("Steam", "https://store.steampowered.com/app/1145360/", "1145360")),
                null,
                "igdb"
        );
    }

    @Test
    @DisplayName("reports ok when search, provider and thumbnail all succeed")
    void reportsOkWhenEverythingWorks() throws Exception {
        when(gameInfoProvider.getProviderName()).thenReturn("igdb");
        when(gameInfoProvider.isEnabled()).thenReturn(true);
        when(gameInfoProvider.searchGames("Hades", 1)).thenReturn(List.of(hades()));
        when(catalogLookup.findMatch(any())).thenReturn(Optional.of(new CatalogLookup.CatalogMatch(UUID.randomUUID(), "Name: Hades")));
        when(enrichmentProvider.getProviderName()).thenReturn("hltb");
        when(enrichmentProvider.isEnabled()).thenReturn(true);
        when(enrichmentProvider.enrichGame(any())).thenReturn(
                GameEnrichmentProvider.EnrichmentResult.success(new CanonicalGame.Builder("Hades").build(), "ok"));
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        when(httpResponse.statusCode()).thenReturn(200);

        ScrapeHealthReport report = service.check();

        assertTrue(report.overallOk());
        assertEquals(1, report.okCount());
        assertEquals(0, report.failedCount());
        assertEquals(2, report.providers().size());

        ScrapeHealthReport.ReferenceGameCheck game = report.referenceGames().get(0);
        assertTrue(game.found());
        assertTrue(game.inCatalog());
        assertEquals(68151L, game.externalId());
        assertEquals("Hades", game.matchedName());
        assertEquals(1, game.providerChecks().size());
        assertTrue(game.providerChecks().get(0).ok());
        assertTrue(game.providerChecks().get(0).enriched());
        assertNotNull(game.thumbnail());
        assertTrue(game.thumbnail().ok());
        assertEquals(200, game.thumbnail().httpStatus());
    }

    @Test
    @DisplayName("marks the reference game as failed when the catalog search finds nothing")
    void failsWhenSearchFindsNothing() {
        when(gameInfoProvider.getProviderName()).thenReturn("igdb");
        when(gameInfoProvider.isEnabled()).thenReturn(true);
        when(gameInfoProvider.searchGames("Hades", 1)).thenReturn(List.of());
        when(enrichmentProvider.getProviderName()).thenReturn("hltb");
        when(enrichmentProvider.isEnabled()).thenReturn(true);

        ScrapeHealthReport report = service.check();

        assertFalse(report.overallOk());
        assertEquals(1, report.failedCount());
        ScrapeHealthReport.ReferenceGameCheck game = report.referenceGames().get(0);
        assertFalse(game.found());
        assertFalse(game.ok());
        assertTrue(game.providerChecks().isEmpty());
        assertNull(game.thumbnail());
    }

    @Test
    @DisplayName("marks the provider check as failed when the provider throws")
    void providerFailureIsReported() throws Exception {
        when(gameInfoProvider.getProviderName()).thenReturn("igdb");
        when(gameInfoProvider.isEnabled()).thenReturn(true);
        when(gameInfoProvider.searchGames("Hades", 1)).thenReturn(List.of(hades()));
        when(catalogLookup.findMatch(any())).thenReturn(Optional.empty());
        when(enrichmentProvider.getProviderName()).thenReturn("hltb");
        when(enrichmentProvider.isEnabled()).thenReturn(true);
        when(enrichmentProvider.enrichGame(any())).thenThrow(new RuntimeException("HLTB unreachable"));
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        when(httpResponse.statusCode()).thenReturn(200);

        ScrapeHealthReport report = service.check();

        ScrapeHealthReport.ReferenceGameCheck game = report.referenceGames().get(0);
        assertTrue(game.found());
        assertFalse(game.ok());
        assertEquals(1, game.providerChecks().size());
        assertFalse(game.providerChecks().get(0).ok());
        assertEquals("HLTB unreachable", game.providerChecks().get(0).message());
    }
}
