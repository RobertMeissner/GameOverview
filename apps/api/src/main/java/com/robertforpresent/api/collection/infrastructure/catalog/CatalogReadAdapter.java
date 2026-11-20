/* (C)2026 */
package com.robertforpresent.api.collection.infrastructure.catalog;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.collection.domain.port.CatalogReadPort;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Adapter implementing {@link CatalogReadPort} on top of the catalog's repository.
 */
@Component
public class CatalogReadAdapter implements CatalogReadPort {

    private final CanonicalGameRepository gameRepository;

    public CatalogReadAdapter(CanonicalGameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    public CanonicalGame get(UUID id) {
        return gameRepository.findById(id).orElseThrow();
    }

    @Override
    public Map<UUID, CanonicalGame> getByIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return gameRepository.findAllByIds(ids).stream()
                .collect(Collectors.toMap(CanonicalGame::getId, game -> game));
    }
}
