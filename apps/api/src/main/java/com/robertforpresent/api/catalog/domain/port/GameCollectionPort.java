package com.robertforpresent.api.catalog.domain.port;

import java.util.UUID;

/**
 * Port for interacting with the game collection module.
 * Defines the contract that the catalog domain needs from the collection module.
 * This follows hexagonal architecture - the domain defines what it needs,
 * and the infrastructure provides the implementation.
 */
public interface GameCollectionPort {
    /**
     * Add a game to a gamer's collection.
     *
     * @param gamerId The gamer's ID
     * @param gameId  The canonical game ID to add
     */
    void addGameToCollection(UUID gamerId, UUID gameId);

    /**
     * Check if a game is already in a gamer's collection.
     *
     * @param gamerId The gamer's ID
     * @param gameId  The canonical game ID to check
     * @return true if the game is in the collection
     */
    boolean isGameInCollection(UUID gamerId, UUID gameId);
}
