package com.robertforpresent.api.collection.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataCollectionRepository extends JpaRepository<PersonalizedGameEntity, UUID> {
    @Query("SELECT p FROM PersonalizedGameEntity p WHERE p.gamerId = :gamerId")
    List<PersonalizedGameEntity> findByGamerId(@Param("gamerId") UUID gamerId);

    @Query("SELECT p FROM PersonalizedGameEntity p WHERE p.gamerId = :gamerId AND p.canonicalGameId = :canonicalGameId")
    Optional<PersonalizedGameEntity> findByGamerIdAndCanonicalGameId(@Param("gamerId") UUID gamerId, @Param("canonicalGameId") UUID canonicalGameId);
}
