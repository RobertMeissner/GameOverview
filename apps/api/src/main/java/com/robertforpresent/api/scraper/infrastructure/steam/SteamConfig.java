package com.robertforpresent.api.scraper.infrastructure.steam;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Steam API integration.
 * Requires Steam Web API key.
 */
@Configuration
@ConfigurationProperties(prefix = "steam")
public class SteamConfig {
    private String apiKey = "";
    private String apiUrl = "https://api.steampowered.com";
    private boolean enabled = false;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public boolean isEnabled() {
        return enabled && !apiKey.isBlank();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
