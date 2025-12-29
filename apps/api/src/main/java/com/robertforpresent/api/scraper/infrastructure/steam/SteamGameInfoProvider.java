package com.robertforpresent.api.scraper.infrastructure.steam;

import com.robertforpresent.api.scraper.domain.model.ScrapedGameInfo;
import com.robertforpresent.api.scraper.domain.port.GameInfoProvider;
import com.robertforpresent.api.scraper.infrastructure.steam.dto.SteamAppDetailsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Steam implementation of the GameInfoProvider port.
 *
 * This adapter handles Steam-specific logic including:
 * - API communication via SteamApiClient
 * - Response parsing
 * - Data transformation to domain models
 *
 * Note: Steam's search API is limited, so this provider is best used
 * for fetching details by Steam App ID rather than general search.
 */
@Component
public class SteamGameInfoProvider implements GameInfoProvider {
    private static final Logger logger = LoggerFactory.getLogger(SteamGameInfoProvider.class);
    private static final String PROVIDER_NAME = "steam";

    private final SteamConfig config;
    private final SteamApiClient apiClient;

    public SteamGameInfoProvider(SteamConfig config, SteamApiClient apiClient) {
        this.config = config;
        this.apiClient = apiClient;
    }

    @Override
    public List<ScrapedGameInfo> searchGames(String query, int limit) {
        // Steam's search API is not well-suited for general searches
        // Recommend using IGDB for search, then fetching details from Steam by App ID
        logger.info("Steam search not implemented - use IGDB for search, then fetch details by Steam App ID");
        return List.of();
    }

    @Override
    public Optional<ScrapedGameInfo> getGameDetails(long externalId) {
        if (!isEnabled()) {
            logger.debug("Steam provider is not enabled");
            return Optional.empty();
        }

        try {
            Optional<SteamAppDetailsResponse> appDetailsOpt = apiClient.getAppDetails((int) externalId);
            return appDetailsOpt.map(this::parseGameDetails);
        } catch (Exception e) {
            logger.error("Error fetching Steam game details for app ID {}", externalId, e);
            return Optional.empty();
        }
    }

    @Override
    public boolean isEnabled() {
        // Note: App details API doesn't require API key, but owned games does
        // So we enable this even without API key for basic functionality
        return config.isEnabled() || true; // Always enable for app details
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    /**
     * Parse Steam app details response into ScrapedGameInfo domain model.
     */
    private ScrapedGameInfo parseGameDetails(SteamAppDetailsResponse response) {
        SteamAppDetailsResponse.AppData data = response.data();

        // Parse genres
        List<String> genres = new ArrayList<>();
        if (data.genres() != null) {
            data.genres().forEach(genre -> genres.add(genre.description()));
        }

        // Parse platforms
        List<String> platforms = new ArrayList<>();
        if (data.platforms() != null) {
            if (data.platforms().windows()) platforms.add("Windows");
            if (data.platforms().mac()) platforms.add("Mac");
            if (data.platforms().linux()) platforms.add("Linux");
        }

        // Parse release year
        Integer releaseYear = null;
        if (data.releaseDate() != null && data.releaseDate().date() != null) {
            releaseYear = parseReleaseYear(data.releaseDate().date());
        }

        // Create Steam store link
        List<ScrapedGameInfo.StoreLink> storeLinks = List.of(
                new ScrapedGameInfo.StoreLink(
                        "Steam",
                        "https://store.steampowered.com/app/" + data.steamAppId(),
                        String.valueOf(data.steamAppId())
                )
        );

        // Convert Metacritic score to 0-100 rating if available
        Double rating = null;
        if (data.metacritic() != null) {
            rating = (double) data.metacritic().score();
        }

        return new ScrapedGameInfo(
                data.steamAppId(),
                data.name(),
                null, // slug - not available from Steam
                data.shortDescription(),
                data.headerImage(),
                rating,
                releaseYear,
                genres,
                platforms,
                storeLinks,
                null, // Playtime info not available from app details
                PROVIDER_NAME
        );
    }

    /**
     * Parse release year from Steam's date format.
     * Steam uses various formats like "Dec 1, 2020", "Coming soon", "2020", etc.
     */
    private Integer parseReleaseYear(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }

        try {
            // Try common formats
            DateTimeFormatter[] formatters = {
                    DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH),
                    DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH),
                    DateTimeFormatter.ofPattern("yyyy", Locale.ENGLISH)
            };

            for (DateTimeFormatter formatter : formatters) {
                try {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    return date.getYear();
                } catch (DateTimeParseException ignored) {
                    // Try next formatter
                }
            }

            // Try to extract year with regex as fallback
            String yearMatch = dateStr.replaceAll(".*?(\\d{4}).*", "$1");
            if (yearMatch.matches("\\d{4}")) {
                return Integer.parseInt(yearMatch);
            }

        } catch (Exception e) {
            logger.debug("Could not parse release date: {}", dateStr);
        }

        return null;
    }
}
