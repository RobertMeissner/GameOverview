package com.robertforpresent.api.collection.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataCollectionRepository extends JpaRepository<PersonalizedGameEntity, String> {
    List<PersonalizedGameEntity> findByGamerId(String gamerId);

    Optional<PersonalizedGameEntity> findByGamerIdAndCanonicalGameId(String gamerId, String canonicalGameId);
}
