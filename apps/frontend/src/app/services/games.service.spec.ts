import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, it, afterEach, expect } from 'vitest';

import { GamesService } from './games.service';
import { CollectionEntry } from '../domain/entities/CollectionEntry';
import { Game } from '../domain/entities/game.model';
import { environment } from '../../environments/environment';

/**
 * Unit tests for GamesService.
 *
 * Demonstrates Angular HTTP testing patterns:
 * 1. Using HttpTestingController to mock HTTP requests
 * 2. Verifying request URL, method, and body
 * 3. Flushing mock responses
 * 4. Testing error scenarios
 */
describe('GamesService', () => {
  let service: GamesService;
  let httpMock: HttpTestingController;

  // Test fixtures
  const mockCollectionEntry: CollectionEntry = {
    id: 'game-123',
    name: 'Stardew Valley',
    rating: 0.95,
    thumbnailUrl: 'https://example.com/stardew.jpg',
    markedAsPlayed: false,
    markedAsHidden: false,
    markedForLater: false,
  };

  const mockGame: Game = {
    id: 'game-123',
    name: 'Stardew Valley',
    rating: 0.95,
    thumbnailUrl: 'https://example.com/stardew.jpg',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GamesService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GamesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllGames()', () => {
    it('should fetch collection from correct URL with userId param and transform thumbnail URLs', () => {
      // given
      const mockResponse: CollectionEntry[] = [mockCollectionEntry];

      // when
      service.getAllGames().subscribe((games) => {
        // then
        expect(games.length).toBe(1);
        // Thumbnail URL should be transformed to cached endpoint
        expect(games[0].thumbnailUrl).toBe(`${environment.apiUrl}/thumbnails/${mockCollectionEntry.id}`);
        expect(games[0].name).toBe(mockCollectionEntry.name);
      });

      // Verify the request
      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/collection` &&
          request.params.get('userId') === environment.userId
      );
      expect(req.request.method).toBe('GET');

      // Flush the mock response
      req.flush(mockResponse);
    });

    it('should return empty array when no games', () => {
      // when
      service.getAllGames().subscribe((games) => {
        expect(games).toEqual([]);
      });

      // then
      const req = httpMock.expectOne((r) => r.url.includes('/collection'));
      req.flush([]);
    });

    it('should propagate HTTP errors', () => {
      // when
      service.getAllGames().subscribe({
        next: () => expect.fail('should have failed'),
        error: (error) => {
          // then
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/collection'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTopGames()', () => {
    it('should fetch top games from correct endpoint and transform thumbnail URLs', () => {
      // given
      const mockResponse: Game[] = [mockGame];

      // when
      service.getTopGames().subscribe((games) => {
        expect(games.length).toBe(1);
        // Thumbnail URL should be transformed to cached endpoint
        expect(games[0].thumbnailUrl).toBe(`${environment.apiUrl}/thumbnails/${mockGame.id}`);
        expect(games[0].name).toBe(mockGame.name);
      });

      // then
      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/collection/top` &&
          request.params.get('userId') === environment.userId
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateGameFlags()', () => {
    it('should send PATCH request with correct body and transform thumbnail URL', () => {
      // given
      const gameId = 'game-123';
      const flags = {
        markedAsPlayed: true,
        markedAsHidden: false,
        markedForLater: true,
      };

      // when
      service.updateGameFlags(gameId, flags).subscribe((result) => {
        expect(result.markedAsPlayed).toBe(true);
        // Thumbnail URL should be transformed to cached endpoint
        expect(result.thumbnailUrl).toBe(`${environment.apiUrl}/thumbnails/${gameId}`);
      });

      // then
      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/collection/games/${gameId}` &&
          request.params.get('userId') === environment.userId
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(flags);

      req.flush({ ...mockCollectionEntry, markedAsPlayed: true, markedForLater: true });
    });

    it('should handle update errors', () => {
      // given
      const gameId = 'nonexistent';
      const flags = { markedAsPlayed: true, markedAsHidden: false, markedForLater: false };

      // when
      service.updateGameFlags(gameId, flags).subscribe({
        next: () => expect.fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      // then
      const req = httpMock.expectOne((r) => r.url.includes(`/collection/games/${gameId}`));
      req.flush('Game not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
