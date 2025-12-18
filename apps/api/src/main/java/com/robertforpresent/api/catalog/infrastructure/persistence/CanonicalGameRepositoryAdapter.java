package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CanonicalGameRepositoryAdapter implements CanonicalGameRepository {
    private final SpringDataCanonicalGameRepository springDataRepository;
    private final CanonicalGameEntityMapper mapper;

    public CanonicalGameRepositoryAdapter(SpringDataCanonicalGameRepository springDataRepository, CanonicalGameEntityMapper mapper) {
        this.springDataRepository = springDataRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<CanonicalGame> findById(String id) {
        return springDataRepository.findById(id).map(mapper::toDomain);
    }


    @Override
    public CanonicalGame save(CanonicalGame game) {
        CanonicalGameEntity entity = mapper.toEntity(game);
        CanonicalGameEntity saved = springDataRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<CanonicalGame> findAll() {
        return springDataRepository.findAll().stream().map(mapper::toDomain).toList();
    }
}
