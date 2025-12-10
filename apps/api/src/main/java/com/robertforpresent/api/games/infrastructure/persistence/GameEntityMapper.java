package com.robertforpresent.api.games.infrastructure.persistence;

import com.robertforpresent.api.games.domain.Game;
import org.springframework.stereotype.Component;

@Component
public class GameEntityMapper {
    public Game toDomain(GameEntity entity) {
        return Game.builder().id(entity.getId()).name(entity.getName()).rating(entity.getRating()).thumbnailUrl(entity.getThumbnailUrl()).build();
    }

    public GameEntity toEntity(Game domain) {
        return new GameEntity(domain.getId(), domain.getName(), domain.getRating(), domain.getThumbnailUrl());
    }
}
