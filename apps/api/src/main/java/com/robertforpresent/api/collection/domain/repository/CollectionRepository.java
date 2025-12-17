package com.robertforpresent.api.collection.domain.repository;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.infrastructure.persistence.PersonalizedGameEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionRepository {
    List<PersonalizedGame> findAll();

    List<PersonalizedGame> findByGamerId(UUID id);

    PersonalizedGame updateFlags(UUID gamerId, UUID canonicalGameId,
                                 boolean played, boolean hidden, boolean forLater);

    PersonalizedGame save(PersonalizedGame game);
}
