package com.robertforpresent.api.collection.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataCollectionRepository extends JpaRepository<PersonalizedGameEntity, UUID> {
    List<PersonalizedGameEntity> findByGamerId(UUID gamerId);
}
