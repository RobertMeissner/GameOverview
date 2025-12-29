package com.robertforpresent.api.catalog.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataCanonicalGameRepository extends JpaRepository<CanonicalGameEntity, String> {
    Optional<CanonicalGameEntity> findBySteamAppId(Integer steamAppId);

    List<CanonicalGameEntity> findByNameContainingIgnoreCase(String name);

    @Query("SELECT g FROM CanonicalGameEntity g WHERE LOWER(g.name) = LOWER(:name)")
    Optional<CanonicalGameEntity> findByNameIgnoreCase(@Param("name") String name);

    @Query("SELECT g FROM CanonicalGameEntity g WHERE g.id IN :ids")
    List<CanonicalGameEntity> findAllByIdIn(@Param("ids") List<String> ids);
}
