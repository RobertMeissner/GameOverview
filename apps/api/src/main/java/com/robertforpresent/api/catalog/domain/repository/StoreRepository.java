package com.robertforpresent.api.catalog.domain.repository;

import com.robertforpresent.api.catalog.domain.model.Store;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Store domain operations.
 */
public interface StoreRepository {
    List<Store> findAll();

    List<Store> findAllActive();

    Optional<Store> findById(UUID id);

    Optional<Store> findByCode(String code);

    Store save(Store store);

    void deleteById(UUID id);
}
