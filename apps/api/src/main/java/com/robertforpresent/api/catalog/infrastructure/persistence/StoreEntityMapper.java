package com.robertforpresent.api.catalog.infrastructure.persistence;

import com.robertforpresent.api.catalog.domain.model.Store;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Mapper for converting between Store domain model and StoreEntity.
 */
@Component
public class StoreEntityMapper {

    public Store toDomain(StoreEntity entity) {
        return new Store(
            UUID.fromString(entity.getId()),
            entity.getCode(),
            entity.getName(),
            entity.getUrl(),
            entity.getIconUrl(),
            entity.isActive()
        );
    }

    public StoreEntity toEntity(Store store) {
        return new StoreEntity(
            store.id().toString(),
            store.code(),
            store.name(),
            store.url(),
            store.iconUrl(),
            store.active()
        );
    }
}
