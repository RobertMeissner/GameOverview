package com.robertforpresent.api.catalog.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCanonicalGameRepository extends JpaRepository<CanonicalGameEntity, String> {
}
