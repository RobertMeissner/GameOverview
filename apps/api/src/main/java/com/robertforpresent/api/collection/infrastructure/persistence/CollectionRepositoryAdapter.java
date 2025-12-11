package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.CollectionRepository;
import org.springframework.stereotype.Repository;

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
        return List.of();
    }

    @Override
    public List<PersonalizedGame> findByGamerId(UUID id) {
        return jpaRepository.findByGamerId(id).stream().map(mapper::toDomain).toList();
    }

    @Override
    public PersonalizedGame save(PersonalizedGame game) {
        PersonalizedGameEntity entity = mapper.toEntity(game);
        PersonalizedGameEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }
}
