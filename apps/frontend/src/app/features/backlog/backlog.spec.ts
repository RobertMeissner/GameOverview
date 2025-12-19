import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, vi, MockedObject, expect } from 'vitest';

import { Backlog } from './backlog';
import { GamesService } from '../../services/games.service';
import { CollectionEntry } from '../../domain/entities/CollectionEntry';

/**
 * Unit tests for Backlog component.
 *
 * Tests sorting, flag changes, and service interactions.
 */
describe('Backlog', () => {
  let component: Backlog;
  let fixture: ComponentFixture<Backlog>;
  let gamesServiceSpy: MockedObject<GamesService>;

  // Test data factory
  const createMockGame = (overrides: Partial<CollectionEntry> = {}): CollectionEntry => ({
    id: 'test-id-1',
    name: 'Test Game',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    rating: 0.85,
    markedAsPlayed: false,
    markedAsHidden: false,
    markedForLater: true, // backlog games are marked for later
    storeLinks: {
      steamLink: null,
      gogLink: null,
      metacriticLink: null,
    },
    ...overrides,
  });

  beforeEach(async () => {
    const spy = {
      getBacklogGames: vi.fn().mockReturnValue(of([])),
      updateGameFlags: vi.fn().mockReturnValue(of(createMockGame())),
    };

    await TestBed.configureTestingModule({
      imports: [Backlog],
      providers: [{ provide: GamesService, useValue: spy }],
    }).compileComponents();

    gamesServiceSpy = TestBed.inject(GamesService) as MockedObject<GamesService>;
    fixture = TestBed.createComponent(Backlog);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call getBacklogGames on init', () => {
      // when
      fixture.detectChanges();

      // then
      expect(gamesServiceSpy.getBacklogGames).toHaveBeenCalledTimes(1);
    });

    it('should populate games signal with service response', async () => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Backlog Game 1' }),
        createMockGame({ id: '2', name: 'Backlog Game 2' }),
      ];
      gamesServiceSpy.getBacklogGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(component.games()).toEqual(mockGames);
    });

    it('should default to sorting by rating descending', () => {
      expect(component.sortField()).toBe('rating');
      expect(component.sortDirection()).toBe('desc');
    });
  });

  describe('sorting', () => {
    it('should sort by rating descending by default', async () => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Low Rated', rating: 0.50 }),
        createMockGame({ id: '2', name: 'High Rated', rating: 0.95 }),
      ];
      gamesServiceSpy.getBacklogGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      const sorted = component.sortedGames();
      expect(sorted[0].name).toBe('High Rated');
      expect(sorted[1].name).toBe('Low Rated');
    });

    it('should toggle sort direction when clicking same field', () => {
      // given
      expect(component.sortDirection()).toBe('desc');

      // when
      component.setSortField('rating');

      // then
      expect(component.sortDirection()).toBe('asc');
    });

    it('should switch to ascending when changing to name field', () => {
      // when
      component.setSortField('name');

      // then
      expect(component.sortField()).toBe('name');
      expect(component.sortDirection()).toBe('asc');
    });

    it('should sort by name alphabetically', async () => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Zelda' }),
        createMockGame({ id: '2', name: 'Asteroids' }),
      ];
      gamesServiceSpy.getBacklogGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.setSortField('name');

      // then - ascending by default for name
      const sorted = component.sortedGames();
      expect(sorted[0].name).toBe('Asteroids');
      expect(sorted[1].name).toBe('Zelda');
    });

    it('should sort by name descending when toggled', async () => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Zelda' }),
        createMockGame({ id: '2', name: 'Asteroids' }),
      ];
      gamesServiceSpy.getBacklogGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();
      component.setSortField('name'); // ascending
      component.setSortField('name'); // toggle to descending

      // then
      const sorted = component.sortedGames();
      expect(sorted[0].name).toBe('Zelda');
      expect(sorted[1].name).toBe('Asteroids');
    });
  });

  describe('flag changes', () => {
    it('should call updateGameFlags when flag changes', () => {
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

    it('should reload games when game is unmarked from backlog', async () => {
      // given
      const game = createMockGame({
        id: 'game-123',
        markedForLater: false, // unmarked from backlog
      });
      gamesServiceSpy.getBacklogGames.mockReturnValue(of([]));
      gamesServiceSpy.updateGameFlags.mockReturnValue(of(game));

      fixture.detectChanges();

      // when
      component.onFlagChange(game);
      await fixture.whenStable();

      // then - getBacklogGames called once on init, once after flag change
      expect(gamesServiceSpy.getBacklogGames).toHaveBeenCalledTimes(2);
    });

    it('should not reload games when game is still in backlog', async () => {
      // given
      const game = createMockGame({
        id: 'game-123',
        markedForLater: true, // still in backlog
      });
      gamesServiceSpy.updateGameFlags.mockReturnValue(of(game));

      fixture.detectChanges();
      const callCountAfterInit = gamesServiceSpy.getBacklogGames.mock.calls.length;

      // when
      component.onFlagChange(game);
      await fixture.whenStable();

      // then - should not reload
      expect(gamesServiceSpy.getBacklogGames).toHaveBeenCalledTimes(callCountAfterInit);
    });
  });

  describe('store links', () => {
    it('should preserve store links in games', async () => {
      // given
      const mockGames = [
        createMockGame({
          id: '1',
          storeLinks: {
            steamLink: 'https://store.steampowered.com/app/413150',
            gogLink: 'https://www.gog.com/game/stardew_valley',
            metacriticLink: null,
          },
        }),
      ];
      gamesServiceSpy.getBacklogGames.mockReturnValue(of(mockGames));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      const games = component.games();
      expect(games[0].storeLinks.steamLink).toBe('https://store.steampowered.com/app/413150');
      expect(games[0].storeLinks.gogLink).toBe('https://www.gog.com/game/stardew_valley');
      expect(games[0].storeLinks.metacriticLink).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle getBacklogGames error gracefully', async () => {
      // given
      const consoleSpy = vi.spyOn(console, 'error');
      gamesServiceSpy.getBacklogGames.mockReturnValue(throwError(() => new Error('API Error')));

      // when
      fixture.detectChanges();
      await fixture.whenStable();

      // then
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.games()).toEqual([]);
    });

    it('should handle updateGameFlags error gracefully', async () => {
      // given
      const consoleSpy = vi.spyOn(console, 'error');
      const game = createMockGame();
      gamesServiceSpy.updateGameFlags.mockReturnValue(throwError(() => new Error('Update failed')));

      // when
      component.onFlagChange(game);
      await fixture.whenStable();

      // then
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
