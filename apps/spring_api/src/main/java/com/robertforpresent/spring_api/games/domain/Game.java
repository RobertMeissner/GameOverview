package com.robertforpresent.spring_api.games.domain;

public record Game(
        String id,
        String name

) {
    public static Game create(String name) {
        return new Game(null, name);
    }
}
