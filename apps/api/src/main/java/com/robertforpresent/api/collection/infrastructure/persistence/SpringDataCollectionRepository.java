package com.robertforpresent.api.collection.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SpringDataCollectionRepository extends JpaRepository<PersonalizedGameEntity, String> {
    List<PersonalizedGameEntity> findByGamerId(String gamerId);

    Optional<PersonalizedGameEntity> findByGamerIdAndCanonicalGameId(String gamerId, String canonicalGameId);

    List<PersonalizedGameEntity> findByCanonicalGameId(String canonicalGameId);

    void deleteByCanonicalGameId(String canonicalGameId);

    @Modifying
    @Query("UPDATE PersonalizedGameEntity p SET p.canonicalGameId = :targetId WHERE p.canonicalGameId = :sourceId")
    void updateCanonicalGameReferences(@Param("sourceId") String sourceId, @Param("targetId") String targetId);
}
