package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CollectionEntityMapper {
    public PersonalizedGame toDomain(PersonalizedGameEntity entity) {
        return new PersonalizedGame.Builder().setCanonicalId(UUID.fromString(entity.getCanonicalGameId())).setGamerId(UUID.fromString(entity.getGamerId()))
                .setMarkAsPlayed(entity.isMarkAsPlayed()).setMarkAsHidden(entity.isMarkAsHidden()).setMarkAsForLater(entity.isMarkAsForLater())
                .setSteamPlaytimeMinutes(entity.getSteamPlaytimeMinutes())
                .setOwnedOnSteam(Boolean.TRUE.equals(entity.getOwnedOnSteam()))
                .setOwnedOnGog(Boolean.TRUE.equals(entity.getOwnedOnGog()))
                .setOwnedOnEpic(Boolean.TRUE.equals(entity.getOwnedOnEpic()))
                .setOwnedOnXbox(Boolean.TRUE.equals(entity.getOwnedOnXbox()))
                .setOwnedOnPlayStation(Boolean.TRUE.equals(entity.getOwnedOnPlayStation()))
                .setOtherStores(entity.getOtherStores())
                .build();
    }

    public PersonalizedGameEntity toEntity(PersonalizedGame domain) {
        return new PersonalizedGameEntity(domain.getGamerId().toString(), domain.getCanonicalGameId().toString(),
                domain.isMarkedAsPlayed(), domain.isMarkedAsHidden(), domain.isMarkedForLater(), domain.getSteamPlaytimeMinutes(),
                domain.isOwnedOnSteam(), domain.isOwnedOnGog(), domain.isOwnedOnEpic(), domain.isOwnedOnXbox(), domain.isOwnedOnPlayStation(), domain.getOtherStores());
    }
}
