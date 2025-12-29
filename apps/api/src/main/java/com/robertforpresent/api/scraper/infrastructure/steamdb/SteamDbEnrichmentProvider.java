package com.robertforpresent.api.scraper.infrastructure.steamdb;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with SteamDB data (pricing, sales history, player counts).
 * TODO: Implement actual SteamDB integration.
 */
@Component
public class SteamDbEnrichmentProvider implements GameEnrichmentProvider {
    private static final String PROVIDER_NAME = "steamdb";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement SteamDB integration
        return EnrichmentResult.noChange(game, "SteamDB enrichment not yet implemented");
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
