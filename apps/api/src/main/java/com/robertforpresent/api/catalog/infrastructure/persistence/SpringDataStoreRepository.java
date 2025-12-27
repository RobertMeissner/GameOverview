package com.robertforpresent.api.catalog.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataStoreRepository extends JpaRepository<StoreEntity, String> {
    Optional<StoreEntity> findByCode(String code);

    List<StoreEntity> findByActiveTrue();
}
