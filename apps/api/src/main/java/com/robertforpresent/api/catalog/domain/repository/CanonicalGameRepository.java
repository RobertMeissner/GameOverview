package com.robertforpresent.api.catalog.domain.repository;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public interface CanonicalGameRepository {
    Optional<CanonicalGame> findById(String id);

    CanonicalGame save(CanonicalGame game);

    List<CanonicalGame> findAll();
}
