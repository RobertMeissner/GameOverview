/* (C)2026 */
package com.robertforpresent.api.collection.domain.port;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Port for reading canonical games from the catalog module.
 */
public interface CatalogReadPort {

    CanonicalGame get(UUID id);

    /**
     * Batch-load games by their IDs, returned as a map for efficient lookup.
     */
    Map<UUID, CanonicalGame> getByIds(List<UUID> ids);
}
