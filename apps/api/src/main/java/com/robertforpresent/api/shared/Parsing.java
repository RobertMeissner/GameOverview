package com.robertforpresent.api.shared;

import org.jspecify.annotations.Nullable;

/**
 * Lenient parsing helpers that return {@code null} instead of throwing on invalid input.
 */
public final class Parsing {

    private Parsing() {
    }

    public static @Nullable Integer parseIntOrNull(@Nullable String value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static @Nullable Long parseLongOrNull(@Nullable String value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
