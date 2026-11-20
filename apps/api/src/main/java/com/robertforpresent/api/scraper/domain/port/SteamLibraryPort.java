/* (C)2026 */
package com.robertforpresent.api.scraper.domain.port;

import java.util.List;
import java.util.Optional;

/**
 * Port for importing a Steam library (owned games with playtime) and reading Steam store app details.
 */
public interface SteamLibraryPort {

    /**
     * One owned game from the Steam library.
     */
    record OwnedGame(int appId, String name, int playtimeMinutes) {}

    /**
     * Public Steam store details for an app.
     */
    record AppDetails(String name, String headerImage) {}

    /**
     * @return true if the Steam integration is configured (API key present)
     */
    boolean isEnabled();

    boolean isValidSteamId(String steamId);

    Optional<List<OwnedGame>> getOwnedGames(String steamId);

    Optional<AppDetails> getAppDetails(int appId);
}
