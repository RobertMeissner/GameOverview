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
    public void addGameToCollection(UUID gamerId, UUID gameId, String store) {
        var existingGame = collectionRepository.findByGamerId(gamerId).stream()
                .filter(pg -> pg.getCanonicalGameId().equals(gameId))
                .findFirst();

        if (existingGame.isPresent()) {
            // Update ownership flags on existing game
            PersonalizedGame game = existingGame.get();
            updateOwnershipFlag(game, store);
            collectionRepository.save(game);
        } else {
            // Create new game with ownership flag set
            PersonalizedGame.Builder builder = new PersonalizedGame.Builder()
                    .setCanonicalId(gameId)
                    .setGamerId(gamerId);
            setOwnershipFlag(builder, store);
            collectionRepository.save(builder.build());
        }
    }

    private void updateOwnershipFlag(PersonalizedGame game, String store) {
        if (store == null) return;
        switch (store.toLowerCase()) {
            case "steam", "steam-family", "steam-licenses" -> game.setOwnedOnSteam(true);
            case "gog" -> game.setOwnedOnGog(true);
            case "epic" -> game.setOwnedOnEpic(true);
            case "xbox" -> game.setOwnedOnXbox(true);
            case "playstation", "ps" -> game.setOwnedOnPlayStation(true);
        }
    }

    private void setOwnershipFlag(PersonalizedGame.Builder builder, String store) {
        if (store == null) return;
        switch (store.toLowerCase()) {
            case "steam", "steam-family", "steam-licenses" -> builder.setOwnedOnSteam(true);
            case "gog" -> builder.setOwnedOnGog(true);
            case "epic" -> builder.setOwnedOnEpic(true);
            case "xbox" -> builder.setOwnedOnXbox(true);
            case "playstation", "ps" -> builder.setOwnedOnPlayStation(true);
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
