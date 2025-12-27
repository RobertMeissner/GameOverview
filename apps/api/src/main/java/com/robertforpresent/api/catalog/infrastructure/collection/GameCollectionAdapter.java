package com.robertforpresent.api.catalog.infrastructure.collection;

import com.robertforpresent.api.catalog.domain.port.GameCollectionPort;
import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Adapter implementing the GameCollectionPort.
 * Bridges the catalog domain to the collection module.
 */
@Component
public class GameCollectionAdapter implements GameCollectionPort {
    private final CollectionRepository collectionRepository;

    public GameCollectionAdapter(CollectionRepository collectionRepository) {
        this.collectionRepository = collectionRepository;
    }

    @Override
    public void addGameToCollection(UUID gamerId, UUID gameId) {
        if (!isGameInCollection(gamerId, gameId)) {
            PersonalizedGame game = new PersonalizedGame.Builder()
                    .setCanonicalId(gameId)
                    .setGamerId(gamerId)
                    .build();
            collectionRepository.save(game);
        }
    }

    @Override
    public boolean isGameInCollection(UUID gamerId, UUID gameId) {
        return collectionRepository.findByGamerId(gamerId).stream()
                .anyMatch(pg -> pg.getCanonicalGameId().equals(gameId));
    }

    @Override
    public void updateCanonicalGameReferences(UUID sourceGameId, UUID targetGameId) {
        collectionRepository.updateCanonicalGameReferences(sourceGameId, targetGameId);
    }
}
