package com.robertforpresent.api.catalog.domain.repository;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;

import java.util.List;
import java.util.Optional;

public interface CanonicalGameRepository {
    Optional<CanonicalGame> findById(String id);

    CanonicalGame save(CanonicalGame game);

    List<CanonicalGame> findAll();
}
