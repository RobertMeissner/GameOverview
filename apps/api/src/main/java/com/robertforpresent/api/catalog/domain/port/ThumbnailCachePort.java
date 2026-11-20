/* (C)2026 */
package com.robertforpresent.api.catalog.domain.port;

import java.util.UUID;

/**
 * Port for controlling the thumbnail cache from the catalog module.
 */
public interface ThumbnailCachePort {

    /**
     * Evict the cached thumbnail for a game, e.g. after its thumbnail URL changed.
     */
    void evict(UUID gameId);
}
