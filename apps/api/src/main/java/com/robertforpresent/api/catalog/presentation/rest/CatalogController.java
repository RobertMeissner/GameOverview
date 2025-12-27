package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.command.UpdateCatalogCommand;
import com.robertforpresent.api.catalog.application.service.CatalogService;
import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for catalog operations.
 * Thin controller - converts DTOs to commands and delegates to services.
 */
@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class CatalogController {
    private final CatalogService service;

    public CatalogController(CatalogService service) {
        this.service = service;
    }

    @GetMapping("/catalog")
    public List<CanonicalGame> games() {
        return service.getAllGames();
    }

    @PatchMapping("/catalog/games/{gameId}")
    public CanonicalGame updateCatalogValues(@PathVariable UUID gameId, @RequestBody UpdateCatalogRequest request) {
        UpdateCatalogCommand command = new UpdateCatalogCommand(
                request.steamAppId(),
                request.steamName(),
                request.gogId(),
                request.gogName(),
                request.gogLink(),
                request.epicId(),
                request.epicName(),
                request.epicLink(),
                request.metacriticScore(),
                request.metacriticName(),
                request.metacriticLink()
        );
        return service.updateCatalogValues(gameId, command);
    }
}
