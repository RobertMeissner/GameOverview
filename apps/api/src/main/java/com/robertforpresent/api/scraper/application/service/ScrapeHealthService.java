package com.robertforpresent.api.scraper.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.model.GogGameData;
import com.robertforpresent.api.catalog.domain.model.SteamGameData;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport.ProviderCheck;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport.ProviderStatus;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport.ReferenceGameCheck;
import com.robertforpresent.api.scraper.application.dto.ScrapeHealthReport.ThumbnailCheck;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.CatalogLookup;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Runs a live health check of the scraping pipeline against a configurable set of reference games
 * ({@code scraper.reference-games}). For each reference game it searches the catalog provider (IGDB),
 * checks whether the game is already in the catalog, runs every enabled enrichment provider against a
 * transient probe game, and fetches the cover image URL to verify thumbnail downloads work.
 */
@Service
@Slf4j
public class ScrapeHealthService {

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    private final GameInfoProvider gameInfoProvider;
    private final List<GameEnrichmentProvider> enrichmentProviders;
    private final CatalogLookup catalogLookup;
    private final HttpClient httpClient;
    private final List<String> referenceGames;

    public ScrapeHealthService(
            GameInfoProvider gameInfoProvider,
            List<GameEnrichmentProvider> enrichmentProviders,
            CatalogLookup catalogLookup,
            HttpClient httpClient,
            @Value("${scraper.reference-games:Elden Ring,Hades,Stardew Valley}") List<String> referenceGames) {
        this.gameInfoProvider = gameInfoProvider;
        this.enrichmentProviders = enrichmentProviders;
        this.catalogLookup = catalogLookup;
        this.httpClient = httpClient;
        this.referenceGames = referenceGames;
    }

    /**
     * Run the health check over all configured reference games.
     */
    public ScrapeHealthReport check() {
        List<ProviderStatus> providers = new ArrayList<>();
        providers.add(new ProviderStatus(gameInfoProvider.getProviderName(), gameInfoProvider.isEnabled()));
        for (GameEnrichmentProvider provider : enrichmentProviders) {
            providers.add(new ProviderStatus(provider.getProviderName(), provider.isEnabled()));
        }

        List<ReferenceGameCheck> checks = new ArrayList<>();
        for (String referenceGame : referenceGames) {
            String query = referenceGame.trim();
            if (!query.isEmpty()) {
                checks.add(checkGame(query));
            }
        }

        int failed = (int) checks.stream().filter(c -> !c.ok()).count();
        return new ScrapeHealthReport(Instant.now(), providers, checks, checks.size() - failed, failed);
    }

    private ReferenceGameCheck checkGame(String query) {
        Optional<ScrapedGameInfo> found = gameInfoProvider.searchGames(query, 1).stream().findFirst();
        if (found.isEmpty()) {
            log.warn("Health check: no catalog result for reference game '{}'", query);
            return new ReferenceGameCheck(query, false, null, null, null, false, List.of(), null, false);
        }

        ScrapedGameInfo info = found.get();
        boolean inCatalog = catalogLookup.findMatch(info).isPresent();

        CanonicalGame probe = toProbeGame(info);
        List<ProviderCheck> providerChecks = new ArrayList<>();
        for (GameEnrichmentProvider provider : enrichmentProviders) {
            if (!provider.isEnabled()) {
                providerChecks.add(new ProviderCheck(provider.getProviderName(), false, false, "disabled"));
                continue;
            }
            try {
                GameEnrichmentProvider.EnrichmentResult result = provider.enrichGame(probe);
                providerChecks.add(new ProviderCheck(provider.getProviderName(), true, result.enriched(), result.message()));
            } catch (Exception e) {
                log.warn("Health check: provider {} failed for '{}'", provider.getProviderName(), query, e);
                providerChecks.add(new ProviderCheck(provider.getProviderName(), false, false,
                        e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            }
        }

        ThumbnailCheck thumbnail = checkThumbnail(info.coverUrl());

        boolean ok = providerChecks.stream().allMatch(ProviderCheck::ok)
                && (thumbnail == null || thumbnail.ok());
        return new ReferenceGameCheck(query, true, info.externalId(), info.name(), info.rating(),
                inCatalog, providerChecks, thumbnail, ok);
    }

    /**
     * Build a transient {@link CanonicalGame} from scraped data so enrichment providers can run
     * without touching the database.
     */
    private CanonicalGame toProbeGame(ScrapedGameInfo info) {
        CanonicalGame.Builder builder = new CanonicalGame.Builder(info.name())
                .setThumbnailUrl(info.coverUrl())
                .setGenres(info.genres());
        if ("igdb".equals(info.source())) {
            builder.setIgdbId(info.externalId())
                    .setIgdbSlug(info.slug())
                    .setIgdbRating(info.rating());
        }
        info.storeLink("Steam")
                .flatMap(ScrapedGameInfo.StoreLink::storeIdAsInt)
                .ifPresent(appId -> builder.setSteamData(new SteamGameData(appId, info.name())));
        info.storeLink("GOG")
                .ifPresent(link -> builder.setGogData(new GogGameData(null, info.name(), link.url())));
        return builder.build();
    }

    /**
     * Verify the cover image URL is reachable (the same kind of request the thumbnail cache makes).
     */
    private @Nullable ThumbnailCheck checkThumbnail(@Nullable String coverUrl) {
        if (coverUrl == null || coverUrl.isBlank()) {
            return null;
        }
        try {
            String url = coverUrl.startsWith("//") ? "https:" + coverUrl : coverUrl;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", USER_AGENT)
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            boolean ok = response.statusCode() == 200;
            return new ThumbnailCheck(true, response.statusCode(), ok);
        } catch (Exception e) {
            log.debug("Health check: thumbnail fetch failed for {}: {}", coverUrl, e.getMessage());
            return new ThumbnailCheck(true, -1, false);
        }
    }
}
