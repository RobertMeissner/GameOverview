package com.robertforpresent.spring_api.games.infrastructure.persistence;

import com.robertforpresent.spring_api.games.domain.Game;
import org.springframework.stereotype.Component;

@Component
public class GameEntityMapper {
    public Game toDomain(GameEntity entity) {
        return new Game(entity.getId(), entity.getName());
    }

    public GameEntity toEntity(Game domain) {
        return new GameEntity(domain.id(), domain.name());
    }
}
