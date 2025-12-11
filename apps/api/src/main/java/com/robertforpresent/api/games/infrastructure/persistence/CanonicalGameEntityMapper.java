package com.robertforpresent.api.games.infrastructure.persistence;

import com.robertforpresent.api.games.domain.model.CanonicalGame;
import org.springframework.stereotype.Component;


@Component
public class CanonicalGameEntityMapper {
    public CanonicalGame toDomain(CanonicalGameEntity entity) {
        return new CanonicalGame.Builder(entity.getName()).setId(entity.getId()).build();
    }

    public CanonicalGameEntity toEntity(CanonicalGame domain) {
        return new CanonicalGameEntity(domain.getId(), domain.getName());
    }
}
