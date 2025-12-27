package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CanonicalGameRepositoryAdapter implements CanonicalGameRepository {
    private final SpringDataCanonicalGameRepository springDataRepository;
    private final CanonicalGameEntityMapper mapper;

    public CanonicalGameRepositoryAdapter(SpringDataCanonicalGameRepository springDataRepository, CanonicalGameEntityMapper mapper) {
        this.springDataRepository = springDataRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<CanonicalGame> findById(UUID id) {
        return springDataRepository.findById(id.toString()).map(mapper::toDomain);
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

    @Override
    public Optional<CanonicalGame> findBySteamAppId(Integer steamAppId) {
        return springDataRepository.findBySteamAppId(steamAppId).map(mapper::toDomain);
    }

    @Override
    public List<CanonicalGame> findByNameContainingIgnoreCase(String name) {
        return springDataRepository.findByNameContainingIgnoreCase(name).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<CanonicalGame> findByNameIgnoreCase(String name) {
        return springDataRepository.findByNameIgnoreCase(name).map(mapper::toDomain);
    }

    @Override
    public List<CanonicalGame> findAllByIds(List<UUID> ids) {
        List<String> stringIds = ids.stream().map(UUID::toString).toList();
        return springDataRepository.findAllByIdIn(stringIds).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        springDataRepository.deleteById(id.toString());
    }
}
