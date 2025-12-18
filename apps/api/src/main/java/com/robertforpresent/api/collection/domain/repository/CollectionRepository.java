package com.robertforpresent.api.collection.domain.repository;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;

import java.util.List;

public interface CollectionRepository {
    List<PersonalizedGame> findAll();

    List<PersonalizedGame> findByGamerId(String id);

    PersonalizedGame updateFlags(String gamerId, String canonicalGameId,
                                 boolean played, boolean hidden, boolean forLater);

    PersonalizedGame save(PersonalizedGame game);
}
