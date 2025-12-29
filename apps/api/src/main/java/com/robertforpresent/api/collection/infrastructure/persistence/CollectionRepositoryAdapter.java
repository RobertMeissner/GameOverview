package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Repository
public class CollectionRepositoryAdapter implements CollectionRepository {
    private final SpringDataCollectionRepository jpaRepository;
    private final CollectionEntityMapper mapper;

    public CollectionRepositoryAdapter(SpringDataCollectionRepository jpaRepository, CollectionEntityMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public List<PersonalizedGame> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<PersonalizedGame> findByGamerId(UUID id) {
        return jpaRepository.findByGamerId(id.toString()).stream().map(mapper::toDomain).toList();
    }

    @Override
    public PersonalizedGame save(PersonalizedGame game) {
        PersonalizedGameEntity entity = mapper.toEntity(game);
        PersonalizedGameEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }


    public PersonalizedGame updateFlags(UUID gamerId, UUID canonicalGameId, boolean played, boolean hidden, boolean forLater) {
        List<PersonalizedGameEntity> entities = jpaRepository.findByGamerIdAndCanonicalGameId(gamerId.toString(), canonicalGameId.toString());

        if (entities.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not in collection");
        }

        // Update all duplicate entries to keep them consistent
        PersonalizedGameEntity primaryEntity = entities.get(0);
        for (PersonalizedGameEntity entity : entities) {
            entity.setMarkAsPlayed(played);
            entity.setMarkAsHidden(hidden);
            entity.setMarkAsForLater(forLater);
            jpaRepository.save(entity);
        }

        return mapper.toDomain(primaryEntity);
    }

    @Override
    public void updateCanonicalGameReferences(UUID sourceGameId, UUID targetGameId) {
        jpaRepository.updateCanonicalGameReferences(sourceGameId.toString(), targetGameId.toString());
    }
}
