/* (C)2025 */
package com.robertforpresent.api.thumbnail.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import com.robertforpresent.api.thumbnail.infrastructure.cache.ThumbnailCacheConfig;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ThumbnailService {

    private final ThumbnailCacheConfig cacheConfig;
    private final CanonicalGameRepository gameRepository;
    private final HttpClient httpClient;

    public ThumbnailService(
            ThumbnailCacheConfig cacheConfig, CanonicalGameRepository gameRepository) {
        this.cacheConfig = cacheConfig;
        this.gameRepository = gameRepository;
        this.httpClient =
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .followRedirects(HttpClient.Redirect.NORMAL)
                        .build();
    }

    public Optional<byte[]> getThumbnail(String gameId) {
        if (!cacheConfig.isEnabled()) {
            return Optional.empty();
        }

        Path cachedFile = getCacheFilePath(gameId);

        if (Files.exists(cachedFile)) {
            return readFromCache(cachedFile);
        }

        return downloadAndCache(gameId, cachedFile);
    }

    public Optional<String> getContentType(String gameId) {
        Path cachedFile = getCacheFilePath(gameId);
        if (Files.exists(cachedFile)) {
            try {
                String contentType = Files.probeContentType(cachedFile);
                return Optional.of(contentType != null ? contentType : "image/jpeg");
            } catch (IOException e) {
                return Optional.of("image/jpeg");
            }
        }
        return Optional.of("image/jpeg");
    }

    private Path getCacheFilePath(String gameId) {
        return cacheConfig.getCachePath().resolve(gameId + ".jpg");
    }

    private Optional<byte[]> readFromCache(Path cachedFile) {
        try {
            log.debug("Serving cached thumbnail: {}", cachedFile.getFileName());
            return Optional.of(Files.readAllBytes(cachedFile));
        } catch (IOException e) {
            log.error("Failed to read cached thumbnail: {}", cachedFile, e);
            return Optional.empty();
        }
    }

    private Optional<byte[]> downloadAndCache(String gameId, Path cachedFile) {
        Optional<CanonicalGame> gameOpt = gameRepository.findById(gameId);
        if (gameOpt.isEmpty()) {
            log.warn("Game not found for thumbnail: {}", gameId);
            return Optional.empty();
        }

        CanonicalGame game = gameOpt.get();
        String thumbnailUrl = game.getThumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            log.warn("No thumbnail URL for game: {}", gameId);
            return Optional.empty();
        }

        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(thumbnailUrl))
                            .timeout(Duration.ofSeconds(30))
                            .GET()
                            .build();

            HttpResponse<InputStream> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() == 200) {
                byte[] imageData = response.body().readAllBytes();
                Files.write(cachedFile, imageData);
                log.info(
                        "Cached thumbnail for game {} ({} bytes)",
                        game.getName(),
                        imageData.length);
                return Optional.of(imageData);
            } else {
                log.warn(
                        "Failed to download thumbnail for {}: HTTP {}",
                        game.getName(),
                        response.statusCode());
                return Optional.empty();
            }
        } catch (IOException | InterruptedException e) {
            log.error("Error downloading thumbnail for {}: {}", game.getName(), e.getMessage());
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return Optional.empty();
        }
    }

    public boolean isCached(String gameId) {
        return Files.exists(getCacheFilePath(gameId));
    }

    public void evict(String gameId) {
        Path cachedFile = getCacheFilePath(gameId);
        try {
            Files.deleteIfExists(cachedFile);
            log.info("Evicted cached thumbnail: {}", gameId);
        } catch (IOException e) {
            log.error("Failed to evict cached thumbnail: {}", gameId, e);
        }
    }

    public long getCacheSize() {
        try {
            return Files.walk(cacheConfig.getCachePath())
                    .filter(Files::isRegularFile)
                    .mapToLong(
                            path -> {
                                try {
                                    return Files.size(path);
                                } catch (IOException e) {
                                    return 0;
                                }
                            })
                    .sum();
        } catch (IOException e) {
            return 0;
        }
    }
}
