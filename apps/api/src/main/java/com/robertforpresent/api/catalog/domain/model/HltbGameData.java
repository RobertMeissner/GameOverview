package com.robertforpresent.api.catalog.domain.model;

import org.jspecify.annotations.Nullable;

/**
 * HowLongToBeat data for a game.
 *
 * @param hltbId          The game's ID on HowLongToBeat
 * @param gameName        The game's name on HLTB (may differ from canonical name)
 * @param mainStoryHours  Time to beat main story in hours
 * @param mainExtraHours  Time to beat main story + extras in hours
 * @param completionistHours Time to 100% complete the game in hours
 */
public record HltbGameData(
        @Nullable Integer hltbId,
        @Nullable String gameName,
        @Nullable Double mainStoryHours,
        @Nullable Double mainExtraHours,
        @Nullable Double completionistHours
) {
    private static final String HLTB_BASE_URL = "https://howlongtobeat.com/game/";

    /**
     * @return Direct link to the HLTB page for this game
     */
    public @Nullable String storeLink() {
        if (hltbId != null) {
            return HLTB_BASE_URL + hltbId;
        }
        return null;
    }

    /**
     * @return The primary playtime metric (main story hours) for filtering
     */
    public @Nullable Double getPrimaryPlaytime() {
        return mainStoryHours;
    }
}
