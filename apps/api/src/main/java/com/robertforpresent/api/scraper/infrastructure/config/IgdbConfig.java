package com.robertforpresent.api.scraper.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for IGDB API integration.
 * Requires Twitch OAuth credentials.
 */
@Configuration
@ConfigurationProperties(prefix = "igdb")
public class IgdbConfig {
    private String clientId = "";
    private String clientSecret = "";
    private boolean enabled = false;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public boolean isEnabled() {
        return enabled && !clientId.isBlank() && !clientSecret.isBlank();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
