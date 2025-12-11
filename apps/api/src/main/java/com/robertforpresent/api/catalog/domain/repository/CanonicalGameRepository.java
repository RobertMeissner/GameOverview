package com.robertforpresent.api.catalog.domain.repository;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CanonicalGameRepository {
    Optional<CanonicalGame> findById(UUID id);

    CanonicalGame save(CanonicalGame game);

    List<CanonicalGame> findAll();
}
