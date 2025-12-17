import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {describe, beforeEach, it, vi, MockedObject} from "vitest";

import { CatalogComponent } from './catalog-component';
import { GamesService } from '../../services/games.service';
import { CollectionEntry } from '../../domain/entities/CollectionEntry';

/**
 * Unit tests for CatalogComponent.
 *
 * Demonstrates Angular testing patterns:
 * 1. Service mocking with Vitest mocks
 * 2. Testing async behavior with async/await and fixture.whenStable()
 * 3. Testing component lifecycle (ngOnInit)
 * 4. Testing user interactions
 * 5. DOM testing with fixture.nativeElement
 */
describe('CatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let gamesServiceSpy: MockedObject<GamesService>;

  // Test data factory
  const createMockGame = (overrides: Partial<CollectionEntry> = {}): CollectionEntry => ({
    id: 'test-id-1',
    name: 'Test Game',
    rating: 0.85,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    markedAsPlayed: false,
    markedAsHidden: false,
    markedForLater: false,
    ...overrides,
  });

  beforeEach(async () => {
    const spy = {
      getAllGames: vi.fn().mockReturnValue(of([])),
      updateGameFlags: vi.fn().mockReturnValue(of(createMockGame())),
    };

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [{ provide: GamesService, useValue: spy }],
    }).compileComponents();

    gamesServiceSpy = TestBed.inject(GamesService) as MockedObject<GamesService>;
    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call getAllGames on init', () => {
      // when
      fixture.detectChanges(); // triggers ngOnInit

      // then
      expect(gamesServiceSpy.getAllGames).toHaveBeenCalledTimes(1);
    });

    it('should populate games signal with service response', async () => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Stardew Valley' }),
        createMockGame({ id: '2', name: 'Half-Life 2' }),
      ];
      gamesServiceSpy.getAllGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(component.games()).toEqual(mockGames);
      expect(component.games().length).toBe(2);
    });

    it('should start with empty games array', () => {
      expect(component.games()).toEqual([]);
    });
  });

  describe('onFlagChange()', () => {
    it('should call updateGameFlags with correct parameters', () => {
      // given
      const game = createMockGame({
        id: 'game-123',
        markedAsPlayed: true,
        markedAsHidden: false,
        markedForLater: true,
      });

      // when
      component.onFlagChange(game);

      // then
      expect(gamesServiceSpy.updateGameFlags).toHaveBeenCalledWith('game-123', {
        markedAsPlayed: true,
        markedAsHidden: false,
        markedForLater: true,
      });
    });

    it('should handle service errors gracefully', async () => {
      // given
      const game = createMockGame();
      const consoleSpy = vi.spyOn(console, 'error');
      gamesServiceSpy.updateGameFlags.mockReturnValue(throwError(() => new Error('API Error')));

      // when
      component.onFlagChange(game);
      await fixture.whenStable();

      // then - should not throw, just log error
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle getAllGames error gracefully', async () => {
      // given
      const consoleSpy = vi.spyOn(console, 'error');
      gamesServiceSpy.getAllGames.mockReturnValue(throwError(() => new Error('Network error')));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.games()).toEqual([]); // Should remain empty
    });
  });
});
