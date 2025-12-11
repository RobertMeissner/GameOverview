package com.robertforpresent.api.games.domain.repository;

import com.robertforpresent.api.games.domain.model.CanonicalGame;

import java.util.Optional;
import java.util.UUID;

public interface CanonicalGameRepository {
    Optional<CanonicalGame> findById(UUID id);

    CanonicalGame save(CanonicalGame game);

}
