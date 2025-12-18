/* (C)2025 */
package com.robertforpresent.api.thumbnail.infrastructure.cache;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Slf4j
public class ThumbnailCacheConfig {

    @Value("${thumbnail.cache.directory:./data/thumbnails}")
    private String cacheDirectory;

    @Value("${thumbnail.cache.enabled:true}")
    private boolean enabled;

    @PostConstruct
    public void init() throws IOException {
        if (enabled) {
            Path cacheDir = Paths.get(cacheDirectory);
            if (!Files.exists(cacheDir)) {
                Files.createDirectories(cacheDir);
                log.info("Created thumbnail cache directory: {}", cacheDir.toAbsolutePath());
            }
        }
    }

    public Path getCachePath() {
        return Paths.get(cacheDirectory);
    }
}
