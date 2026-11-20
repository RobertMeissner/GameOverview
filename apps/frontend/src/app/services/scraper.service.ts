import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
  AddGameResult,
  EnrichedSearchResult,
  GameSearchResult,
  ScrapedGameInfo,
  ScraperStatus
} from '../domain/entities/ScrapedGameInfo';
import {ScrapeHealthReport} from '../domain/entities/ScrapeHealthReport';

@Injectable({providedIn: 'root'})
export class ScraperService {
  private readonly apiUrl = environment.apiUrl;
  private readonly userId = environment.userId;

  constructor(private http: HttpClient) {
  }

  searchGames(query: string, limit: number = 10): Observable<GameSearchResult> {
    return this.http.get<GameSearchResult>(`${this.apiUrl}/scraper/search`, {
      params: {query, limit: limit.toString()}
    });
  }

  searchGamesEnriched(query: string, limit: number = 10): Observable<EnrichedSearchResult> {
    return this.http.get<EnrichedSearchResult>(`${this.apiUrl}/scraper/search/enriched`, {
      params: {query, limit: limit.toString()}
    });
  }

  getGameDetails(igdbId: number): Observable<ScrapedGameInfo> {
    return this.http.get<ScrapedGameInfo>(`${this.apiUrl}/scraper/games/${igdbId}`);
  }

  addGameToLibrary(externalId: number): Observable<AddGameResult> {
    return this.http.post<AddGameResult>(`${this.apiUrl}/scraper/games/${externalId}/add`, null, {
      params: {userId: this.userId}
    });
  }

  getStatus(): Observable<ScraperStatus> {
    return this.http.get<ScraperStatus>(`${this.apiUrl}/scraper/status`);
  }

  /**
   * Run the scrape health check over the configured reference games.
   * Makes live calls to the external providers, so trigger it on demand.
   */
  getHealth(): Observable<ScrapeHealthReport> {
    return this.http.get<ScrapeHealthReport>(`${this.apiUrl}/scraper/health`);
  }
}
