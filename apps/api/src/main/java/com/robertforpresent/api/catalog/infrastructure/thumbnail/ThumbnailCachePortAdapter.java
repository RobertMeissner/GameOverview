/* (C)2026 */
package com.robertforpresent.api.catalog.infrastructure.thumbnail;

import com.robertforpresent.api.catalog.domain.port.ThumbnailCachePort;
import com.robertforpresent.api.thumbnail.application.service.ThumbnailService;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Adapter implementing {@link ThumbnailCachePort} on top of the thumbnail module.
 */
@Component
public class ThumbnailCachePortAdapter implements ThumbnailCachePort {

    private final ThumbnailService thumbnailService;

    public ThumbnailCachePortAdapter(ThumbnailService thumbnailService) {
        this.thumbnailService = thumbnailService;
    }

    @Override
    public void evict(UUID gameId) {
        thumbnailService.evict(gameId);
    }
}
