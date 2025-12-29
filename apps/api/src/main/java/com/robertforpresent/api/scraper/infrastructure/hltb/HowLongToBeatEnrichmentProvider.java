package com.robertforpresent.api.scraper.infrastructure.hltb;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.port.GameEnrichmentProvider;
import org.springframework.stereotype.Component;

/**
 * Enriches canonical games with HowLongToBeat data (playtime estimates).
 * TODO: Implement actual HLTB API/scraping integration.
 */
@Component
public class HowLongToBeatEnrichmentProvider implements GameEnrichmentProvider {
    private static final String PROVIDER_NAME = "hltb";

    @Override
    public EnrichmentResult enrichGame(CanonicalGame game) {
        // TODO: Implement HowLongToBeat integration
        return EnrichmentResult.noChange(game, "HLTB enrichment not yet implemented");
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isEnabled() {
        return false; // Disabled until implemented
    }
}
