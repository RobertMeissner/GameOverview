package com.robertforpresent.api.scraper.infrastructure.hltb.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Response from the HLTB search API.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record HltbSearchResponse(
        @JsonProperty("data") List<HltbGame> data
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record HltbGame(
            @JsonProperty("game_id") int gameId,
            @JsonProperty("game_name") String gameName,
            @JsonProperty("game_image") String gameImage,
            @JsonProperty("comp_main") int compMain,           // Main story in seconds
            @JsonProperty("comp_plus") int compPlus,           // Main + Extra in seconds
            @JsonProperty("comp_100") int comp100,             // Completionist in seconds
            @JsonProperty("comp_all") int compAll,             // All styles in seconds
            @JsonProperty("review_score") int reviewScore,
            @JsonProperty("profile_platform") String profilePlatform
    ) {
        /**
         * Convert main story time from seconds to hours.
         */
        public double mainStoryHours() {
            return compMain > 0 ? compMain / 3600.0 : 0;
        }

        /**
         * Convert main + extra time from seconds to hours.
         */
        public double mainExtraHours() {
            return compPlus > 0 ? compPlus / 3600.0 : 0;
        }

        /**
         * Convert completionist time from seconds to hours.
         */
        public double completionistHours() {
            return comp100 > 0 ? comp100 / 3600.0 : 0;
        }
    }
}
