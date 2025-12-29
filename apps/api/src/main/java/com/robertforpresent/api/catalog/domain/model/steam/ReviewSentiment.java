package com.robertforpresent.api.catalog.domain.model.steam;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ReviewSentiment {
    UNDEFINED(0, "Undefined"),
    OVERWHELMING_NEGATIVE(1, "Overwhelmingly Negative"),
    VERY_NEGATIVE(2, "Very Negative"),
    NEGATIVE(3, "Negative"),
    MOSTLY_NEGATIVE(4, "Mostly Negative"),
    MIXED(5, "Mixed"),
    MOSTLY_POSITIVE(6, "Mostly Positive"),
    POSITIVE(7, "Positive"),
    VERY_POSITIVE(8, "Very Positive"),
    OVERWHELMING_POSITIVE(9, "Overwhelmingly Positive");

    private final int score;
    private final String displayName;

    private static final Map<Integer, ReviewSentiment> BY_SCORE =
            Stream.of(values()).collect(Collectors.toMap(s -> s.score, s -> s));

    private static final Map<String, ReviewSentiment> BY_DISPLAY_NAME =
            Stream.of(values()).collect(Collectors.toMap(s -> s.displayName, s -> s));

    ReviewSentiment(int score, String displayName) {
        this.score = score;
        this.displayName = displayName;
    }

    public int score() {
        return score;
    }

    public String displayName() {
        return displayName;
    }

    public static ReviewSentiment fromScore(int score) {
        return BY_SCORE.getOrDefault(score, UNDEFINED);
    }

    public static ReviewSentiment fromDisplayName(String displayName) {
        return BY_DISPLAY_NAME.getOrDefault(displayName, UNDEFINED);
    }
}
