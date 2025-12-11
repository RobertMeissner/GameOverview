package com.robertforpresent.api.games.domain.service;

import com.robertforpresent.api.games.domain.model.CanonicalGame;
import com.robertforpresent.api.games.domain.model.StoreGameData;
import com.robertforpresent.api.games.domain.repository.CanonicalGameRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CatalogService {
    private final CanonicalGameRepository repository;

    /**
     * Finds or create a canonical game matching the given store data.
     */
    public CanonicalGame findOrCreate(StoreGameData storeData) {
        var found = repository.findById(UUID.fromString(StoreGameData.id));
        return found.orElseGet(() -> new CanonicalGame.Builder("test").build());
    }

    public CanonicalGame get(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public CatalogService(CanonicalGameRepository repository){
        this.repository = repository;
    }
}

