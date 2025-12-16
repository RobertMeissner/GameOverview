package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import org.springframework.stereotype.Component;

@Component
public class CollectionEntityMapper {
    public PersonalizedGame toDomain(PersonalizedGameEntity entity) {
        return new PersonalizedGame.Builder().setCanonicalId(entity.getCanonicalGameId()).setGamerId(entity.getGamerId())
                .setMarkAsPlayed(entity.isMarkAsPlayed()).setMarkAsHidden(entity.isMarkAsHidden()).setMarkAsForLater(entity.isMarkAsForLater())
                .build();
    }

    public PersonalizedGameEntity toEntity(PersonalizedGame domain) {
        return new PersonalizedGameEntity(domain.getGamerId(), domain.getCanonicalGameId(),
                domain.isMarkedAsPlayed(), domain.isMarkedAsHidden(), domain.isMarkedForLater());
    }
}
