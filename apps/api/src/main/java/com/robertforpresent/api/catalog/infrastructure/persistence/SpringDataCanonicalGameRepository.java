package com.robertforpresent.api.catalog.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SpringDataCanonicalGameRepository extends JpaRepository<CanonicalGameEntity, UUID> {
}
