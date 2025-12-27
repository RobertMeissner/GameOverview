package com.robertforpresent.api.collection.domain.repository;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;

import java.util.List;
import java.util.UUID;

public interface CollectionRepository {
    List<PersonalizedGame> findAll();

    List<PersonalizedGame> findByGamerId(UUID id);

    PersonalizedGame updateFlags(UUID gamerId, UUID canonicalGameId,
                                 boolean played, boolean hidden, boolean forLater);

    PersonalizedGame save(PersonalizedGame game);

    /**
     * Update all collection entries from source game to target game.
     * Used when merging duplicate games.
     *
     * @param sourceGameId The source game ID to update from
     * @param targetGameId The target game ID to update to
     */
    void updateCanonicalGameReferences(UUID sourceGameId, UUID targetGameId);
}
