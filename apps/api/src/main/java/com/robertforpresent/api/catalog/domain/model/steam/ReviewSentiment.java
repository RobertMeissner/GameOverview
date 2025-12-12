package com.robertforpresent.api.catalog.domain.model.steam;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ReviewSentiment {
    UNDEFINED(0),
    OVERWHELMING_NEGATIVE(1),
    VERY_NEGATIVE(2),
    NEGATIVE(3),
    MOSTLY_NEGATIVE(4),
    MIXED(5),
    MOSTLY_POSITIVE(6),
    POSITIVE(7),
    VERY_POSITIVE(8),
    OVERWHELMING_POSITIVE(9);

    private final int score;

    private static final Map<Integer, ReviewSentiment> BY_SCORE =
            Stream.of(values()).collect(Collectors.toMap(s -> s.score, s -> s));

    ReviewSentiment(int score) {
        this.score = score;
    }

    public int score() {
        return score;
    }

    public static ReviewSentiment fromScore(int score) {
        return BY_SCORE.getOrDefault(score, UNDEFINED);
    }
}
