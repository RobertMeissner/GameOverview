package com.robertforpresent.api.games.infrastructure.persistence;

import com.robertforpresent.api.games.domain.model.CanonicalGame;
import com.robertforpresent.api.games.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CanonicalGameRepositoryAdapter implements CanonicalGameRepository {
    private final SpringDataCanonicalGameRepository jpaRepository;
    private final CanonicalGameEntityMapper mapper;

    public CanonicalGameRepositoryAdapter(SpringDataCanonicalGameRepository jpaRepository, CanonicalGameEntityMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<CanonicalGame> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public CanonicalGame save(CanonicalGame game) {
        CanonicalGameEntity entity = mapper.toEntity(game);
        CanonicalGameEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<CanonicalGame> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }
}
