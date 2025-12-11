package com.robertforpresent.api.collection.domain.repository;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;

import java.util.List;
import java.util.UUID;

public interface GamerCollectionRepository {
    List<PersonalizedGame> findAll();

    List<PersonalizedGame> findByGamerId(UUID id);

    PersonalizedGame save(PersonalizedGame game);
}
