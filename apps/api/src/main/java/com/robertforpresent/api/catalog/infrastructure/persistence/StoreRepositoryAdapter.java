package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.Store;
import com.robertforpresent.api.catalog.domain.repository.StoreRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter implementing StoreRepository using Spring Data JPA.
 */
@Repository
public class StoreRepositoryAdapter implements StoreRepository {
    private final SpringDataStoreRepository jpaRepository;
    private final StoreEntityMapper mapper;

    public StoreRepositoryAdapter(SpringDataStoreRepository jpaRepository, StoreEntityMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public List<Store> findAll() {
        return jpaRepository.findAll().stream()
            .map(mapper::toDomain)
            .toList();
    }

    @Override
    public List<Store> findAllActive() {
        return jpaRepository.findByActiveTrue().stream()
            .map(mapper::toDomain)
            .toList();
    }

    @Override
    public Optional<Store> findById(UUID id) {
        return jpaRepository.findById(id.toString())
            .map(mapper::toDomain);
    }

    @Override
    public Optional<Store> findByCode(String code) {
        return jpaRepository.findByCode(code)
            .map(mapper::toDomain);
    }

    @Override
    public Store save(Store store) {
        StoreEntity entity = mapper.toEntity(store);
        StoreEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id.toString());
    }
}
