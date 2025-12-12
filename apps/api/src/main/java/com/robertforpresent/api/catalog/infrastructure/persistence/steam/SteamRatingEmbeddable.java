package com.robertforpresent.api.catalog.infrastructure.persistence.steam;

import com.robertforpresent.api.catalog.domain.model.steam.ReviewSentiment;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;

public class SteamRatingEmbeddable {
    @Getter
    @Column(name = "steam_positive")
    private Integer positive;

    @Getter
    @Column(name = "steam_negative")
    private Integer negative;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "steam_sentiment")
    private ReviewSentiment sentiment;

    protected SteamRatingEmbeddable() {}

    public SteamRatingEmbeddable(Integer positive, Integer negative, ReviewSentiment sentiment) {
        this.positive = positive;
        this.negative = negative;
        this.sentiment = sentiment;
    }
}
