/* (C)2025 */
package com.robertforpresent.api.thumbnail.presentation.rest;

import com.robertforpresent.api.thumbnail.application.service.ThumbnailService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/thumbnails")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ThumbnailController {

    private final ThumbnailService thumbnailService;

    @GetMapping("/{gameId}")
    public ResponseEntity<byte[]> getThumbnail(@PathVariable String gameId) {
        Optional<byte[]> thumbnail = thumbnailService.getThumbnail(gameId);

        if (thumbnail.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String contentType =
                thumbnailService.getContentType(gameId).orElse(MediaType.IMAGE_JPEG_VALUE);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(7)))
                .body(thumbnail.get());
    }

    @GetMapping("/{gameId}/status")
    public ResponseEntity<ThumbnailStatus> getThumbnailStatus(@PathVariable String gameId) {
        boolean cached = thumbnailService.isCached(gameId);
        return ResponseEntity.ok(new ThumbnailStatus(gameId, cached));
    }

    @GetMapping("/stats")
    public ResponseEntity<CacheStats> getCacheStats() {
        long cacheSize = thumbnailService.getCacheSize();
        return ResponseEntity.ok(new CacheStats(cacheSize, formatSize(cacheSize)));
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "B";
        return String.format("%.1f %s", bytes / Math.pow(1024, exp), pre);
    }

    public record ThumbnailStatus(String gameId, boolean cached) {}

    public record CacheStats(long totalBytes, String formattedSize) {}
}
