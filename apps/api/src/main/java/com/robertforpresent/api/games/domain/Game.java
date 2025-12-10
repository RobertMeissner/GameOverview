package com.robertforpresent.api.games.domain;


import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
public class Game {
    String id;
    String name;

    @Builder.Default
    float rating = 0.0f;

    String thumbnailUrl;
}
