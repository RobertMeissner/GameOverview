package com.robertforpresent.api.collection.domain.model;

import java.util.Map;
import java.util.UUID;

/**
 * A gamer's personal game collection
 *
 * <h2>Relationship to Catalog</h2>
 * <p>Each PersonalizedGame references {@link com.robertforpresent.api.games.domain.model.CanonicalGame} by ID only</p>
 *
 * @see PersonalizedGame
 * @see com.robertforpresent.api.games.domain.model.CanonicalGame
 */
public class GamerCollection {
    private final UUID id;
    private final UUID gamerId;
    private final Map<UUID, PersonalizedGame> games;

    public GamerCollection(UUID id, UUID gamerId, Map<UUID, PersonalizedGame> games) {
        this.id = id;
        this.gamerId = gamerId;
        this.games = games;
    }

    /**
     * To implement
     * addGame
     * … service functions? e.g. contains, getAll, ...
     */
}
