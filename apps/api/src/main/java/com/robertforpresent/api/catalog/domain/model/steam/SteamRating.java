package com.robertforpresent.api.catalog.domain.model.steam;

import java.util.Objects;

public record SteamRating(int positive, int negative, ReviewSentiment sentiment) {
    public static SteamRating of(int positive, int negative, ReviewSentiment sentiment) {
        if (positive < 0) throw new IllegalArgumentException("Number of positive reviews must be >= 0");
        if (negative < 0) throw new IllegalArgumentException("Number of positive reviews must be >= 0");
        Objects.requireNonNull(sentiment, "sentiment required");
        return new SteamRating(positive, negative, sentiment);
    }

    public int rating() {
        if (negative == 0) {
            return 0;
        }
        return positive * 100 / (positive + negative) ;

    }
}
