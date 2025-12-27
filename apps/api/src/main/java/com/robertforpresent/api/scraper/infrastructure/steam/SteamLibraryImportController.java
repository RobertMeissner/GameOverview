package com.robertforpresent.api.scraper.infrastructure.steam;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for importing Steam library with playtime information.
 */
@RestController
@RequestMapping("/steam")
@CrossOrigin(origins = "http://localhost:4200")
public class SteamLibraryImportController {
    private static final Logger logger = LoggerFactory.getLogger(SteamLibraryImportController.class);
    private static final UUID DEFAULT_GAMER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final SteamLibraryImportService importService;
    private final SteamConfig steamConfig;

    public SteamLibraryImportController(SteamLibraryImportService importService, SteamConfig steamConfig) {
        this.importService = importService;
        this.steamConfig = steamConfig;
    }

    /**
     * Import user's Steam library including playtime information.
     *
     * @param request The import request containing Steam ID
     * @return Result of the import operation
     */
    @PostMapping("/import-library")
    public ResponseEntity<SteamLibraryImportResponse> importLibrary(@RequestBody SteamLibraryImportRequest request) {
        logger.info("Received Steam library import request for Steam ID: {}", request.steamId());

        if (!steamConfig.isEnabled()) {
            logger.error("Steam integration is not enabled. Please configure STEAM_API_KEY.");
            return ResponseEntity.badRequest()
                    .body(new SteamLibraryImportResponse(
                            false,
                            0,
                            0,
                            0,
                            "Steam integration is not enabled. Please configure STEAM_API_KEY environment variable."
                    ));
        }

        if (request.steamId() == null || request.steamId().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new SteamLibraryImportResponse(
                            false,
                            0,
                            0,
                            0,
                            "Steam ID is required"
                    ));
        }

        try {
            UUID gamerId = request.gamerId() != null ? request.gamerId() : DEFAULT_GAMER_ID;
            SteamLibraryImportService.SteamLibraryImportResult result = importService.importSteamLibrary(
                    request.steamId(),
                    gamerId
            );

            boolean success = result.failed() == 0 || (result.created() + result.updated() > 0);

            return ResponseEntity.ok(new SteamLibraryImportResponse(
                    success,
                    result.created(),
                    result.updated(),
                    result.failed(),
                    result.message()
            ));
        } catch (Exception e) {
            logger.error("Failed to import Steam library for Steam ID: {}", request.steamId(), e);
            return ResponseEntity.internalServerError()
                    .body(new SteamLibraryImportResponse(
                            false,
                            0,
                            0,
                            0,
                            "Error importing Steam library: " + e.getMessage()
                    ));
        }
    }

    /**
     * Check if Steam integration is properly configured.
     *
     * @return Configuration status
     */
    @GetMapping("/status")
    public ResponseEntity<SteamStatusResponse> getStatus() {
        boolean enabled = steamConfig.isEnabled();
        String message = enabled
                ? "Steam integration is enabled and ready"
                : "Steam integration requires STEAM_API_KEY environment variable";

        return ResponseEntity.ok(new SteamStatusResponse(enabled, message));
    }

    // Request/Response DTOs
    public record SteamLibraryImportRequest(
            String steamId,
            UUID gamerId
    ) {}

    public record SteamLibraryImportResponse(
            boolean success,
            int created,
            int updated,
            int failed,
            String message
    ) {}

    public record SteamStatusResponse(
            boolean enabled,
            String message
    ) {}
}
