package com.robertforpresent.api.scraper.infrastructure.steam.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SteamAppDetailsResponse(
        @JsonProperty("success") boolean success,
        @JsonProperty("data") AppData data
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AppData(
            @JsonProperty("type") String type,
            @JsonProperty("name") String name,
            @JsonProperty("steam_appid") int steamAppId,
            @JsonProperty("required_age") Integer requiredAge,
            @JsonProperty("is_free") boolean isFree,
            @JsonProperty("detailed_description") String detailedDescription,
            @JsonProperty("about_the_game") String aboutTheGame,
            @JsonProperty("short_description") String shortDescription,
            @JsonProperty("supported_languages") String supportedLanguages,
            @JsonProperty("header_image") String headerImage,
            @JsonProperty("website") String website,
            @JsonProperty("developers") List<String> developers,
            @JsonProperty("publishers") List<String> publishers,
            @JsonProperty("platforms") Platforms platforms,
            @JsonProperty("categories") List<Category> categories,
            @JsonProperty("genres") List<Genre> genres,
            @JsonProperty("release_date") ReleaseDate releaseDate,
            @JsonProperty("metacritic") Metacritic metacritic,
            @JsonProperty("recommendations") Recommendations recommendations
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Platforms(
            @JsonProperty("windows") boolean windows,
            @JsonProperty("mac") boolean mac,
            @JsonProperty("linux") boolean linux
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Category(
            @JsonProperty("id") int id,
            @JsonProperty("description") String description
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Genre(
            @JsonProperty("id") String id,
            @JsonProperty("description") String description
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ReleaseDate(
            @JsonProperty("coming_soon") boolean comingSoon,
            @JsonProperty("date") String date
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Metacritic(
            @JsonProperty("score") int score,
            @JsonProperty("url") String url
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Recommendations(
            @JsonProperty("total") int total
    ) {}
}
