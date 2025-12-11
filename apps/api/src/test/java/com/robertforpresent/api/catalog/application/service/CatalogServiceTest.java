package com.robertforpresent.api.catalog.application.service;

import com.robertforpresent.api.catalog.domain.model.CanonicalGame;
import com.robertforpresent.api.catalog.domain.repository.CanonicalGameRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {
    @Mock
    private CanonicalGameRepository repository;

    @InjectMocks
    private CatalogService service;

    @Test
    void testGetAllGames() {
        List<CanonicalGame> expected = List.of(new CanonicalGame.Builder("Stardew Valley").build());
        when(repository.findAll()).thenReturn(expected);
        assertEquals(1, service.getAllGames().size());
    }
}
