package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import org.springframework.stereotype.Component;


@Component
public class CanonicalGameEntityMapper {
    public CanonicalGame toDomain(CanonicalGameEntity entity) {
        return new CanonicalGame.Builder(entity.getName()).setId(entity.getId()).setRating(entity.getRating()).setThumbnailUrl(entity.getThumbnailUrl()).build();
    }

    public CanonicalGameEntity toEntity(CanonicalGame domain) {
        return new CanonicalGameEntity(domain.getId(), domain.getName(), domain.getRating(), domain.getThumbnailUrl());
    }
}
