package com.robertforpresent.api.collection.infrastructure.persistence;

import com.robertforpresent.api.collection.domain.model.PersonalizedGame;
import com.robertforpresent.api.collection.domain.repository.GamerCollectionRepository;
import com.robertforpresent.api.games.infrastructure.persistence.CanonicalGameEntity;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class GamerCollectionRepositoryAdapter implements GamerCollectionRepository {
    private final SpringDataGamerCollectionRepository jpaRepository;
    private final GamerCollectionEntityMapper mapper;

    public GamerCollectionRepositoryAdapter(SpringDataGamerCollectionRepository jpaRepository, GamerCollectionEntityMapper mapper) {
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
