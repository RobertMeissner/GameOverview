package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.Store;
import com.robertforpresent.api.catalog.domain.repository.StoreRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Application service for managing game stores.
 */
@Slf4j
@Service
public class StoreService {
    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    /**
     * Initialize default stores on application startup.
     */
    @PostConstruct
    public void initializeDefaultStores() {
        initStoreIfMissing("steam", "Steam", "https://store.steampowered.com",
            "https://store.steampowered.com/favicon.ico");
        initStoreIfMissing("gog", "GOG", "https://www.gog.com",
            "https://www.gog.com/favicon.ico");
        initStoreIfMissing("epic", "Epic Games", "https://www.epicgames.com",
            "https://www.epicgames.com/favicon.ico");
        initStoreIfMissing("family", "Steam Family Sharing", "https://store.steampowered.com",
            "https://store.steampowered.com/favicon.ico");
        initStoreIfMissing("metacritic", "Metacritic", "https://www.metacritic.com",
            "https://www.metacritic.com/favicon.ico");
        log.info("Default stores initialized");
    }

    private void initStoreIfMissing(String code, String name, String url, String iconUrl) {
        if (storeRepository.findByCode(code).isEmpty()) {
            Store store = Store.create(code, name, url, iconUrl);
            storeRepository.save(store);
            log.info("Created store: {}", code);
        }
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public List<Store> getActiveStores() {
        return storeRepository.findAllActive();
    }

    public Optional<Store> getStoreByCode(String code) {
        return storeRepository.findByCode(code);
    }

    public Store saveStore(Store store) {
        return storeRepository.save(store);
    }
}
