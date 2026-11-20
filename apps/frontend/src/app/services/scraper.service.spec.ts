import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, it, afterEach, expect } from 'vitest';

import { ScraperService } from './scraper.service';
import { ScrapeHealthReport } from '../domain/entities/ScrapeHealthReport';
import { environment } from '../../environments/environment';

describe('ScraperService', () => {
  let service: ScraperService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ScraperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getHealth requests GET /scraper/health and returns the report', () => {
    const mockReport: ScrapeHealthReport = {
      checkedAt: '2026-11-19T15:00:00Z',
      providers: [
        { name: 'igdb', enabled: true },
        { name: 'hltb', enabled: true }
      ],
      referenceGames: [
        {
          query: 'Hades',
          found: true,
          externalId: 68151,
          matchedName: 'Hades',
          rating: 92,
          inCatalog: true,
          providerChecks: [
            { provider: 'hltb', ok: true, enriched: true, message: 'Enriched with HLTB data' }
          ],
          thumbnail: { attempted: true, httpStatus: 200, ok: true },
          ok: true
        }
      ],
      okCount: 1,
      failedCount: 0
    };

    let result: ScrapeHealthReport | undefined;
    service.getHealth().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/scraper/health`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReport);

    expect(result).toEqual(mockReport);
    expect(result?.referenceGames[0].providerChecks[0].provider).toBe('hltb');
  });
});
