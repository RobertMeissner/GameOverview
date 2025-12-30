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

    /**
     * Find all games that have duplicate names (case-insensitive).
     * Returns only games whose normalized name appears more than once in the database.
     * Uses a subquery to efficiently identify duplicate names at the database level.
     */
    @Query("SELECT g FROM CanonicalGameEntity g WHERE LOWER(TRIM(g.name)) IN " +
           "(SELECT LOWER(TRIM(g2.name)) FROM CanonicalGameEntity g2 " +
           "GROUP BY LOWER(TRIM(g2.name)) HAVING COUNT(g2) > 1) " +
           "ORDER BY LOWER(TRIM(g.name))")
    List<CanonicalGameEntity> findGamesWithDuplicateNames();
}
