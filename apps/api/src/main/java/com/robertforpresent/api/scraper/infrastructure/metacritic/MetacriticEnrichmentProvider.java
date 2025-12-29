package com.robertforpresent.api.scraper.infrastructure.metacritic;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with Metacritic data.
 * TODO: Implement actual Metacritic API integration.
 */
@Component
public class MetacriticEnrichmentProvider implements GameEnrichmentProvider {
    private static final Logger logger = LoggerFactory.getLogger(MetacriticEnrichmentProvider.class);
    private static final String PROVIDER_NAME = "metacritic";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement Metacritic API integration
        // For now, skip enrichment
        return EnrichmentResult.noChange(game, "Metacritic enrichment not yet implemented");
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isEnabled() {
        // Disabled until implemented
        return false;
    }
}
