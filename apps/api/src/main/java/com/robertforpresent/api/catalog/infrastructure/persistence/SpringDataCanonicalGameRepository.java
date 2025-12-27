package com.robertforpresent.api.catalog.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataCanonicalGameRepository extends JpaRepository<CanonicalGameEntity, String> {
    Optional<CanonicalGameEntity> findBySteamAppId(Integer steamAppId);

    List<CanonicalGameEntity> findByNameContainingIgnoreCase(String name);
}
