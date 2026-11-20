package com.robertforpresent.api.catalog.domain.port;

/**
 * Base contract for external game data sources (search providers, enrichment providers).
 */
public interface ExternalSource {

    /**
     * @return Provider identifier (e.g. "igdb", "steam", "hltb")
     */
    String getProviderName();

    /**
     * @return true if the provider is enabled and properly configured
     */
    boolean isEnabled();
}
