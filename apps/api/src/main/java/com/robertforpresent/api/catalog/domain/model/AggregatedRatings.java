package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;

public record AggregatedRatings(
        @Nullable SteamRating steam) {

    /**
     *
     * @return Rating from 0 to 100 as integer.
     */
    public int rating() {
        System.out.println(steam);
        var scores = new ArrayList<Integer>();
        if (steam != null) {
            scores.add(steam.rating());
        }
        return (int) scores.stream().mapToInt(f -> f).average().orElse(0);
    }
}
