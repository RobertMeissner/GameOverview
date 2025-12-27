package com.robertforpresent.api.catalog.presentation.rest;

import com.robertforpresent.api.catalog.application.command.ImportGameCommand;
import com.robertforpresent.api.catalog.application.service.GameImportService;
import com.robertforpresent.api.catalog.application.service.GameImportService.BulkImportResult;
import com.robertforpresent.api.catalog.application.service.GameImportService.SingleImportResult;
import lombok.extern.slf4j.Slf4j;
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
@CrossOrigin(origins = "http://localhost:4200")
public class GameImportController {
    private static final UUID DEFAULT_GAMER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final GameImportService importService;

    public GameImportController(GameImportService importService) {
        this.importService = importService;
    }

    /**
     * Import multiple games from a store in bulk.
     */
    @PostMapping("/bulk")
    public ResponseEntity<BulkImportResponse> bulkImport(@RequestBody List<GameImportRequest> requests) {
        List<ImportGameCommand> commands = requests.stream()
                .map(this::toCommand)
                .toList();

        BulkImportResult result = importService.importGames(commands, DEFAULT_GAMER_ID);

        return ResponseEntity.ok(toResponse(result));
    }

    /**
     * Import a single game from a store.
     */
    @PostMapping("/single")
    public ResponseEntity<ImportResult> importSingle(@RequestBody GameImportRequest request) {
        try {
            SingleImportResult result = importService.importSingleGame(toCommand(request), DEFAULT_GAMER_ID);
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
