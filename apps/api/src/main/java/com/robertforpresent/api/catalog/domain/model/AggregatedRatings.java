package com.robertforpresent.api.catalog.domain.model;

import com.robertforpresent.api.catalog.domain.model.steam.SteamRating;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;

public record AggregatedRatings(
        @Nullable SteamRating steam,
        @Nullable Double igdb) {

    /**
     *
     * @return Rating from 0 to 100 as integer, averaged over all available sources.
     */
    public int rating() {
        var scores = new ArrayList<Double>();
        if (steam != null) {
            scores.add((double) steam.rating());
        }
        if (igdb != null) {
            scores.add(igdb);
        }
        return (int) Math.round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0));
    }
}
