package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.command.ImportGameCommand;
import com.robertforpresent.api.catalog.application.service.GameImportService;
import com.robertforpresent.api.catalog.application.service.GameImportService.BulkImportResult;
import com.robertforpresent.api.catalog.application.service.GameImportService.SingleImportResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for bulk importing games from stores.
 * Thin controller - delegates all business logic to GameImportService.
 */
@Slf4j
@RestController
@RequestMapping("/import")
public class GameImportController {
    private final GameImportService importService;
    private final UUID defaultGamerId;

    public GameImportController(
            GameImportService importService,
            @Value("${app.default-gamer-id:4c580456-1116-4091-b1d6-99fc02b47246}") UUID defaultGamerId) {
        this.importService = importService;
        this.defaultGamerId = defaultGamerId;
    }

    /**
     * Import multiple games from a store in bulk.
     */
    @PostMapping("/bulk")
    public ResponseEntity<BulkImportResponse> bulkImport(
            @RequestBody List<GameImportRequest> requests,
            @RequestParam(required = false) UUID userId) {
        List<ImportGameCommand> commands = requests.stream()
                .map(this::toCommand)
                .toList();

        BulkImportResult result = importService.importGames(commands, resolveGamerId(userId));

        return ResponseEntity.ok(toResponse(result));
    }

    /**
     * Import a single game from a store.
     */
    @PostMapping("/single")
    public ResponseEntity<ImportResult> importSingle(
            @RequestBody GameImportRequest request,
            @RequestParam(required = false) UUID userId) {
        try {
            SingleImportResult result = importService.importSingleGame(toCommand(request), resolveGamerId(userId));
            return ResponseEntity.ok(toResponse(result));
        } catch (Exception e) {
            log.error("Failed to import game: {}", request.name(), e);
            return ResponseEntity.badRequest()
                    .body(new ImportResult(request.name(), null, false, "Error: " + e.getMessage()));
        }
    }

    private ImportGameCommand toCommand(GameImportRequest request) {
        return new ImportGameCommand(
                request.name(),
                request.store(),
                request.storeId(),
                request.storeLink(),
                request.thumbnailUrl()
        );
    }

    private UUID resolveGamerId(UUID userId) {
        return userId != null ? userId : defaultGamerId;
    }

    private ImportResult toResponse(SingleImportResult result) {
        return new ImportResult(result.name(), result.gameId(), result.created(), result.message());
    }

    private BulkImportResponse toResponse(BulkImportResult result) {
        List<ImportResult> results = result.results().stream()
                .map(this::toResponse)
                .toList();
        return new BulkImportResponse(result.created(), result.updated(), result.failed(), results);
    }

    // Response DTOs
    public record ImportResult(String name, String gameId, boolean created, String message) {}
    public record BulkImportResponse(int created, int updated, int failed, List<ImportResult> results) {}
}
