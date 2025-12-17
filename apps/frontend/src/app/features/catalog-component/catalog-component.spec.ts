import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { CatalogComponent } from './catalog-component';
import { GamesService } from '../../services/games.service';
import { CollectionEntry } from '../../domain/entities/CollectionEntry';

/**
 * Unit tests for CatalogComponent.
 *
 * Demonstrates Angular testing patterns:
 * 1. Service mocking with Jasmine spies
 * 2. Testing async behavior with fakeAsync/tick
 * 3. Testing component lifecycle (ngOnInit)
 * 4. Testing user interactions
 * 5. DOM testing with fixture.nativeElement
 */
describe('CatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let gamesServiceSpy: jasmine.SpyObj<GamesService>;

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
    // Create spy object with all service methods
    const spy = jasmine.createSpyObj('GamesService', ['getAllGames', 'updateGameFlags']);
    // Default behavior: return empty array
    spy.getAllGames.and.returnValue(of([]));
    spy.updateGameFlags.and.returnValue(of(createMockGame()));

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [{ provide: GamesService, useValue: spy }],
    }).compileComponents();

    gamesServiceSpy = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
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

    it('should populate games signal with service response', fakeAsync(() => {
      // given
      const mockGames = [
        createMockGame({ id: '1', name: 'Stardew Valley' }),
        createMockGame({ id: '2', name: 'Half-Life 2' }),
      ];
      gamesServiceSpy.getAllGames.and.returnValue(of(mockGames));

      // when
      fixture.detectChanges();
      tick();

      // then
      expect(component.games()).toEqual(mockGames);
      expect(component.games().length).toBe(2);
    }));

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

    it('should handle service errors gracefully', fakeAsync(() => {
      // given
      const game = createMockGame();
      const consoleSpy = spyOn(console, 'error');
      gamesServiceSpy.updateGameFlags.and.returnValue(throwError(() => new Error('API Error')));

      // when
      component.onFlagChange(game);
      tick();

      // then - should not throw, just log error
      expect(consoleSpy).toHaveBeenCalled();
    }));
  });

  describe('error handling', () => {
    it('should handle getAllGames error gracefully', fakeAsync(() => {
      // given
      const consoleSpy = spyOn(console, 'error');
      gamesServiceSpy.getAllGames.and.returnValue(throwError(() => new Error('Network error')));

      // when
      fixture.detectChanges();
      tick();

      // then
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.games()).toEqual([]); // Should remain empty
    }));
  });
});
