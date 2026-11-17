package com.robertforpresent.api.scraper.infrastructure.steam.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SteamStoreSearchResponse(
        @JsonProperty("total") int total,
        @JsonProperty("items") List<Item> items
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            @JsonProperty("type") String type,
            @JsonProperty("name") String name,
            @JsonProperty("id") long id
    ) {}
}
