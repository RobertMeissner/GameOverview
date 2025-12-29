package com.robertforpresent.api.scraper.infrastructure.epic;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with Epic Games Store data.
 * TODO: Implement actual Epic Games API integration.
 */
@Component
public class EpicGamesEnrichmentProvider implements GameEnrichmentProvider {
    private static final String PROVIDER_NAME = "epic";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement Epic Games integration
        return EnrichmentResult.noChange(game, "Epic Games enrichment not yet implemented");
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
