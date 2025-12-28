package com.robertforpresent.api.scraper.infrastructure.protondb;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with ProtonDB data (Linux compatibility ratings).
 * TODO: Implement actual ProtonDB API integration.
 */
@Component
public class ProtonDbEnrichmentProvider implements GameEnrichmentProvider {
    private static final String PROVIDER_NAME = "protondb";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement ProtonDB integration
        return EnrichmentResult.noChange(game, "ProtonDB enrichment not yet implemented");
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isEnabled() {
        return false;
    }
}
