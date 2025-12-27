package com.robertforpresent.api.scraper.infrastructure.steam.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SteamOwnedGamesResponse(
        @JsonProperty("response") ResponseData response
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ResponseData(
            @JsonProperty("game_count") int gameCount,
            @JsonProperty("games") List<SteamGame> games
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SteamGame(
            @JsonProperty("appid") int appId,
            @JsonProperty("name") String name,
            @JsonProperty("playtime_forever") int playtimeForever, // in minutes
            @JsonProperty("img_icon_url") String imgIconUrl,
            @JsonProperty("img_logo_url") String imgLogoUrl,
            @JsonProperty("has_community_visible_stats") Boolean hasCommunityVisibleStats,
            @JsonProperty("playtime_windows_forever") Integer playtimeWindowsForever,
            @JsonProperty("playtime_mac_forever") Integer playtimeMacForever,
            @JsonProperty("playtime_linux_forever") Integer playtimeLinuxForever
    ) {}
}
