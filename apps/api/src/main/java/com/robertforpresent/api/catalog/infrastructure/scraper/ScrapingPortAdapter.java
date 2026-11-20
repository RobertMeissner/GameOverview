/* (C)2026 */
package com.robertforpresent.api.catalog.infrastructure.scraper;

import com.robertforpresent.api.catalog.domain.port.ScrapingPort;
import com.robertforpresent.api.scraper.application.service.GameScraperService;
import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Adapter implementing {@link ScrapingPort} on top of the scraper module's application service.
 */
@Component
public class ScrapingPortAdapter implements ScrapingPort {

    private final GameScraperService scraperService;

    public ScrapingPortAdapter(GameScraperService scraperService) {
        this.scraperService = scraperService;
    }

    @Override
    public Optional<ScrapedGameInfo> findFirstByName(String name) {
        return scraperService.searchGames(name, 1).results().stream().findFirst();
    }

    @Override
    public Optional<ScrapedGameInfo> getGameDetails(long externalId) {
        return scraperService.getGameDetails(externalId);
    }
}
