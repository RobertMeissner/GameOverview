package com.robertforpresent.api.scraper.infrastructure.gog;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with GOG data.
 * TODO: Implement actual GOG API integration.
 */
@Component
public class GogEnrichmentProvider implements GameEnrichmentProvider {
    private static final String PROVIDER_NAME = "gog";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement GOG integration
        return EnrichmentResult.noChange(game, "GOG enrichment not yet implemented");
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
